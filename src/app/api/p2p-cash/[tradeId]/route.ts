import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";

const TRADE_DIRECTIONS = ["usdt_to_cash", "cash_to_usdt"] as const;

type TradeDirection = (typeof TRADE_DIRECTIONS)[number];

function isValidDateInput(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

function isTradeDirection(value: unknown): value is TradeDirection {
  return typeof value === "string" && TRADE_DIRECTIONS.includes(value as TradeDirection);
}

function parseTradePayload(body: any) {
  if (!body) {
    return { error: "Missing payload" as const };
  }

  if (!isValidDateInput(body.trade_date)) {
    return { error: "Invalid trade date" as const };
  }

  if (!isTradeDirection(body.direction)) {
    return { error: "Invalid trade direction" as const };
  }

  const usdtAmount = Number(body.usdt_amount);
  const cashAmount = Number(body.cash_amount);

  if (!Number.isFinite(usdtAmount) || usdtAmount <= 0) {
    return { error: "USDT amount must be greater than 0" as const };
  }

  if (!Number.isFinite(cashAmount) || cashAmount <= 0) {
    return { error: "Cash amount must be greater than 0" as const };
  }

  const cashCurrency =
    typeof body.cash_currency === "string" && body.cash_currency.trim()
      ? body.cash_currency.trim().toUpperCase().slice(0, 12)
      : "NPR";

  const notes =
    typeof body.notes === "string" && body.notes.trim().length > 0
      ? body.notes.trim()
      : null;

  return {
    payload: {
      trade_date: body.trade_date,
      direction: body.direction,
      usdt_amount: usdtAmount,
      cash_amount: cashAmount,
      cash_currency: cashCurrency,
      notes
    }
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: trade, error } = await db
    .from("p2p_cash_trades")
    .select("id, trade_date, direction, usdt_amount, cash_amount, cash_currency, notes")
    .eq("id", params.tradeId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "P2P trade not found" }, { status: 404 });
  }

  return NextResponse.json({ trade });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseTradePayload(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data: trade, error: updateError } = await db
    .from("p2p_cash_trades")
    .update(parsed.payload)
    .eq("id", params.tradeId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError) {
    const status = updateError.code === "PGRST116" ? 404 : 500;
    const error = status === 404 ? "P2P trade not found" : "Failed to update P2P trade";
    return NextResponse.json({ error }, { status });
  }

  const year = Number(parsed.payload.trade_date.slice(0, 4));
  if (Number.isFinite(year)) {
    await db
      .from("financial_years")
      .upsert({ user_id: user.id, year }, { onConflict: "user_id,year" });
  }

  return NextResponse.json({ trade });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error: deleteError } = await db
    .from("p2p_cash_trades")
    .delete()
    .eq("id", params.tradeId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete P2P trade" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
