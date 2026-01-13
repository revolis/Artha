import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { getAvailableYears, getYearDateRange } from "@/lib/supabase/queries";

type EntryRow = {
  entry_date: string;
  entry_type: "profit" | "loss" | "fee" | "tax" | "transfer";
  amount_usd_base: number | string;
};

type SnapshotRow = {
  snapshot_date: string;
  total_value_usd: number;
};

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function normalizeAmount(entry: EntryRow) {
  const amount = Math.abs(toNumber(entry.amount_usd_base));
  if (entry.entry_type === "profit") return amount;
  if (entry.entry_type === "transfer") return 0;
  return -amount;
}

function buildSnapshotsFromEntries(entries: EntryRow[]) {
  const dailyNet = new Map<string, number>();

  entries.forEach((entry) => {
    const dateKey = entry.entry_date.slice(0, 10);
    dailyNet.set(dateKey, (dailyNet.get(dateKey) ?? 0) + normalizeAmount(entry));
  });

  const sortedDates = Array.from(dailyNet.keys()).sort();
  let runningTotal = 0;

  return sortedDates.map((dateKey) => {
    runningTotal += dailyNet.get(dateKey) ?? 0;
    return {
      snapshot_date: dateKey,
      total_value_usd: runningTotal
    };
  });
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const parsedYear = yearParam ? Number(yearParam) : new Date().getUTCFullYear();
  const year = Number.isFinite(parsedYear) ? parsedYear : new Date().getUTCFullYear();
  const { start, end } = getYearDateRange(year);
  const getYearsSafe = async () => {
    try {
      return await getAvailableYears(supabase, data.user.id);
    } catch (err) {
      return [year];
    }
  };

  const { data: snapshots, error: snapshotError } = await supabase
    .from("portfolio_snapshots")
    .select("snapshot_date, total_value_usd")
    .eq("user_id", data.user.id)
    .gte("snapshot_date", start)
    .lt("snapshot_date", end)
    .order("snapshot_date", { ascending: true });

  if (snapshotError) {
    return NextResponse.json({ error: "Failed to load snapshots" }, { status: 500 });
  }

  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("entry_date, entry_type, amount_usd_base")
    .eq("user_id", data.user.id)
    .gte("entry_date", start)
    .lt("entry_date", end)
    .order("entry_date", { ascending: true });

  if (entriesError) {
    const years = await getYearsSafe();
    return NextResponse.json({ snapshots: snapshots ?? [], years });
  }

  const derived = buildSnapshotsFromEntries((entries ?? []) as EntryRow[]);
  if (derived.length === 0) {
    const years = await getYearsSafe();
    return NextResponse.json({ snapshots: snapshots ?? [], years });
  }

  const upsertPayload = derived.map((snapshot) => ({
    ...snapshot,
    user_id: data.user.id
  }));

  const { data: upserted } = await supabase
    .from("portfolio_snapshots")
    .upsert(upsertPayload, { onConflict: "user_id,snapshot_date" })
    .select("snapshot_date, total_value_usd")
    .order("snapshot_date", { ascending: true });

  const years = await getYearsSafe();
  return NextResponse.json({ snapshots: upserted ?? derived, years });
}
