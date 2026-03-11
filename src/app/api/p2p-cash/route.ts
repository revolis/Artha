import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
import { getYearDateRange } from "@/lib/firebase/queries";

const TRADE_DIRECTIONS = ["usdt_to_cash", "cash_to_usdt"] as const;

type TradeDirection = (typeof TRADE_DIRECTIONS)[number];

type TradeRow = {
  id: string;
  trade_date: string;
  direction: TradeDirection;
  usdt_amount: number | string;
  cash_amount: number | string;
  cash_currency: string | null;
  notes: string | null;
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return NaN;
}

function isValidDateInput(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

function isTradeDirection(value: unknown): value is TradeDirection {
  return typeof value === "string" && TRADE_DIRECTIONS.includes(value as TradeDirection);
}

function normalizeTradeRows(rows: TradeRow[]) {
  return rows.map((row) => {
    const usdtAmount = toNumber(row.usdt_amount);
    const cashAmount = toNumber(row.cash_amount);
    return {
      id: row.id,
      trade_date: row.trade_date,
      direction: row.direction,
      usdt_amount: Number.isFinite(usdtAmount) ? usdtAmount : 0,
      cash_amount: Number.isFinite(cashAmount) ? cashAmount : 0,
      cash_currency: row.cash_currency ?? "NPR",
      notes: row.notes ?? null
    };
  });
}

function buildSummary(rows: ReturnType<typeof normalizeTradeRows>) {
  let soldUsdt = 0;
  let receivedCash = 0;
  let boughtUsdt = 0;
  let paidCash = 0;
  let sellCount = 0;
  let buyCount = 0;

  rows.forEach((row) => {
    if (row.direction === "usdt_to_cash") {
      soldUsdt += row.usdt_amount;
      receivedCash += row.cash_amount;
      sellCount += 1;
      return;
    }

    boughtUsdt += row.usdt_amount;
    paidCash += row.cash_amount;
    buyCount += 1;
  });

  const avgSellRate = soldUsdt > 0 ? receivedCash / soldUsdt : 0;
  const avgBuyRate = boughtUsdt > 0 ? paidCash / boughtUsdt : 0;

  return {
    sell: {
      usdt: soldUsdt,
      cash: receivedCash,
      count: sellCount,
      avg_rate: avgSellRate
    },
    buy: {
      usdt: boughtUsdt,
      cash: paidCash,
      count: buyCount,
      avg_rate: avgBuyRate
    },
    net: {
      usdt: boughtUsdt - soldUsdt,
      cash: receivedCash - paidCash
    }
  };
}

function buildYears(rows: ReturnType<typeof normalizeTradeRows>) {
  const years = new Set<number>();

  rows.forEach((row) => {
    const year = Number(row.trade_date.slice(0, 4));
    if (Number.isFinite(year)) {
      years.add(year);
    }
  });

  const currentYear = new Date().getUTCFullYear();
  years.add(currentYear);

  return Array.from(years).sort((a, b) => a - b);
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

export async function GET(request: NextRequest) {
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const parsedYear = yearParam ? Number(yearParam) : new Date().getUTCFullYear();
  const selectedYear = Number.isFinite(parsedYear) ? parsedYear : new Date().getUTCFullYear();
  const { start, end } = getYearDateRange(selectedYear);

  const { data: allRows, error: allRowsError } = await db
    .from("p2p_cash_trades")
    .select("id, trade_date, direction, usdt_amount, cash_amount, cash_currency, notes")
    .eq("user_id", user.id)
    .order("trade_date", { ascending: false });

  if (allRowsError) {
    return NextResponse.json({ error: "Failed to load P2P trades" }, { status: 500 });
  }

  const normalizedAllRows = normalizeTradeRows((allRows ?? []) as TradeRow[]);
  const years = buildYears(normalizedAllRows);

  const { data: yearlyRows, error: yearlyRowsError } = await db
    .from("p2p_cash_trades")
    .select("id, trade_date, direction, usdt_amount, cash_amount, cash_currency, notes")
    .eq("user_id", user.id)
    .gte("trade_date", start)
    .lt("trade_date", end)
    .order("trade_date", { ascending: false });

  if (yearlyRowsError) {
    return NextResponse.json({ error: "Failed to load yearly P2P trades" }, { status: 500 });
  }

  const trades = normalizeTradeRows((yearlyRows ?? []) as TradeRow[]);
  const summary = buildSummary(trades);

  return NextResponse.json({
    selectedYear,
    years,
    trades,
    summary
  });
}

export async function POST(request: NextRequest) {
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

  const payload = {
    ...parsed.payload,
    user_id: user.id
  };

  const { data: trade, error: insertError } = await db
    .from("p2p_cash_trades")
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create P2P trade" }, { status: 500 });
  }

  const year = Number(payload.trade_date.slice(0, 4));
  if (Number.isFinite(year)) {
    await db
      .from("financial_years")
      .upsert({ user_id: user.id, year }, { onConflict: "user_id,year" });
  }

  return NextResponse.json({ trade });
}
