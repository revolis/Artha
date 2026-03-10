import { format, parseISO } from "date-fns";

import type { SupabaseClient } from "@supabase/supabase-js";

export type NetSeriesKey = "monthly" | "quarterly" | "halfYear" | "yearly" | "all";

export type HeatmapDay = {
  date: string;
  net: number;
  profit: number;
  loss: number;
  topCategory: string | null;
  topSource: string | null;
};

export type DashboardYearData = {
  year: number;
  targets: {
    id: string;
    title: string;
    subtitle?: string;
    progress: number;
    currentValue: number;
    targetValue: number;
    timeframe: "year" | "quarter" | "month" | "week" | "day";
    targetType: "income" | "net" | "portfolio_growth";
    startDate: string;
    endDate: string;
    categoryId?: string | null;
    categoryName?: string | null;
  }[];
  portfolio: {
    totalValue: number;
    changeValue: number;
    changePercent: number;
  };
  pnl: {
    net: number;
    profit: number;
    loss: number;
    fees: number;
    taxes: number;
  };
  averageMonthlyNet: number;
  categoryContribution: { name: string; value: number }[];
  netSeries: Record<NetSeriesKey, { date: string; net: number }[]>;
  portfolioSeries: { date: string; value: number }[];
  recentEntries: {
    id: string;
    type: string;
    category: string;
    source: string;
    amount: number;
    date: string;
    notes: string;
  }[];
  heatmapDays: HeatmapDay[];
  hasTaxOrFee: boolean;
};

type EntryRow = {
  id: string;
  entry_date: string;
  entry_type: "profit" | "loss" | "fee" | "tax" | "transfer";
  amount_usd_base: number | string;
  notes: string | null;
  category: { name: string | null } | null;
  source: { platform: string | null } | null;
};

type GoalRow = {
  id: string;
  name: string | null;
  purpose: string | null;
  timeframe: "year" | "quarter" | "month" | "week" | "day";
  target_type: "income" | "net" | "portfolio_growth";
  target_value_usd: number | string;
  start_date: string;
  end_date: string;
  category_id: string | null;
  category: { name: string | null } | null;
};

type SnapshotRow = {
  snapshot_date: string;
  total_value_usd: number | string;
};

export function getYearDateRange(year: number) {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  return { start, end };
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(value);
}

function normalizeAmount(entry: EntryRow) {
  const amount = Math.abs(toNumber(entry.amount_usd_base));
  if (entry.entry_type === "profit") return amount;
  if (entry.entry_type === "transfer") return 0;
  return -amount;
}

function buildMonthlySeries(entries: EntryRow[], year: number) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = months.map((month) => ({ date: month, net: 0 }));

  entries.forEach((entry) => {
    const date = parseISO(entry.entry_date);
    if (date.getUTCFullYear() !== year) return;
    const monthIndex = date.getUTCMonth();
    data[monthIndex].net += normalizeAmount(entry);
  });

  return data;
}

function buildQuarterlySeries(entries: EntryRow[], year: number) {
  const data = [
    { date: "Q1", net: 0 },
    { date: "Q2", net: 0 },
    { date: "Q3", net: 0 },
    { date: "Q4", net: 0 }
  ];

  entries.forEach((entry) => {
    const date = parseISO(entry.entry_date);
    if (date.getUTCFullYear() !== year) return;
    const quarterIndex = Math.floor(date.getUTCMonth() / 3);
    data[quarterIndex].net += normalizeAmount(entry);
  });

  return data;
}

function buildHalfYearSeries(entries: EntryRow[], year: number) {
  const data = [
    { date: "H1", net: 0 },
    { date: "H2", net: 0 }
  ];

  entries.forEach((entry) => {
    const date = parseISO(entry.entry_date);
    if (date.getUTCFullYear() !== year) return;
    const halfIndex = date.getUTCMonth() < 6 ? 0 : 1;
    data[halfIndex].net += normalizeAmount(entry);
  });

  return data;
}

function buildYearlySeries(net: number, year: number) {
  return [{ date: String(year), net }];
}

function buildAllSeries(net: number, year: number) {
  return [{ date: String(year), net }];
}

function computeCategoryContribution(entries: EntryRow[]) {
  const incomeByCategory = new Map<string, number>();
  let totalIncome = 0;

  entries.forEach((entry) => {
    if (entry.entry_type !== "profit") return;
    const amount = Math.abs(toNumber(entry.amount_usd_base));
    const name = entry.category?.name ?? "Uncategorized";
    totalIncome += amount;
    incomeByCategory.set(name, (incomeByCategory.get(name) ?? 0) + amount);
  });

  return Array.from(incomeByCategory.entries()).map(([name, value]) => ({
    name,
    value: totalIncome ? Math.round((value / totalIncome) * 100) : 0
  }));
}

function computePnlTotals(entries: EntryRow[]) {
  let profit = 0;
  let loss = 0;
  let fees = 0;
  let taxes = 0;
  let net = 0;

  entries.forEach((entry) => {
    const amount = Math.abs(toNumber(entry.amount_usd_base));
    switch (entry.entry_type) {
      case "profit":
        profit += amount;
        net += amount;
        break;
      case "loss":
        loss += amount;
        net -= amount;
        break;
      case "fee":
        fees += amount;
        net -= amount;
        break;
      case "tax":
        taxes += amount;
        net -= amount;
        break;
      case "transfer":
      default:
        break;
    }
  });

  return { profit, loss, fees, taxes, net };
}

function computeAverageMonthlyNet(entries: EntryRow[], year: number) {
  const monthlyNet = new Map<number, number>();

  entries.forEach((entry) => {
    if (entry.entry_type === "transfer") return;
    const date = parseISO(entry.entry_date);
    if (date.getUTCFullYear() !== year) return;
    const monthIndex = date.getUTCMonth();
    monthlyNet.set(monthIndex, (monthlyNet.get(monthIndex) ?? 0) + normalizeAmount(entry));
  });

  if (monthlyNet.size === 0) return 0;
  const total = Array.from(monthlyNet.values()).reduce((sum, value) => sum + value, 0);
  return total / monthlyNet.size;
}

function filterEntriesByRange(entries: EntryRow[], startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  return entries.filter((entry) => {
    const date = parseISO(entry.entry_date);
    return date >= start && date <= end;
  });
}

function getPortfolioValueForRange(
  snapshots: SnapshotRow[],
  startDate: string,
  endDate: string
) {
  if (snapshots.length === 0) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);

  const inRange = snapshots.filter((snapshot) => {
    const date = new Date(snapshot.snapshot_date);
    return date >= start && date <= end;
  });

  if (inRange.length === 0) return 0;
  const last = inRange[inRange.length - 1];
  return toNumber(last.total_value_usd);
}

function computePortfolioStats(series: SnapshotRow[]) {
  if (series.length === 0) {
    return { totalValue: 0, changeValue: 0, changePercent: 0 };
  }

  const sorted = [...series].sort(
    (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
  );
  const first = toNumber(sorted[0]?.total_value_usd);
  const last = toNumber(sorted[sorted.length - 1]?.total_value_usd);
  const changeValue = last - first;
  const changePercent = first ? (changeValue / first) * 100 : 0;

  return { totalValue: last, changeValue, changePercent };
}

function buildPortfolioSeries(series: SnapshotRow[]) {
  return series.map((snapshot) => ({
    date: format(new Date(snapshot.snapshot_date), "MMM"),
    value: toNumber(snapshot.total_value_usd)
  }));
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
    } as SnapshotRow;
  });
}

function pickTopLabel(values: Map<string, number>) {
  let topLabel: string | null = null;
  let topValue = 0;
  values.forEach((value, label) => {
    const magnitude = Math.abs(value);
    if (magnitude > topValue) {
      topValue = magnitude;
      topLabel = label;
    }
  });
  return topLabel;
}

function buildHeatmapDays(entries: EntryRow[], year: number): HeatmapDay[] {
  const daily = new Map<
    string,
    {
      net: number;
      profit: number;
      loss: number;
      categoryTotals: Map<string, number>;
      sourceTotals: Map<string, number>;
    }
  >();

  entries.forEach((entry) => {
    const dateKey = entry.entry_date.slice(0, 10);
    const stats =
      daily.get(dateKey) ??
      {
        net: 0,
        profit: 0,
        loss: 0,
        categoryTotals: new Map<string, number>(),
        sourceTotals: new Map<string, number>()
      };

    const amount = Math.abs(toNumber(entry.amount_usd_base));
    let delta = 0;
    if (entry.entry_type === "profit") {
      delta = amount;
      stats.profit += amount;
    } else if (["loss", "fee", "tax"].includes(entry.entry_type)) {
      delta = -amount;
      stats.loss += amount;
    }

    stats.net += delta;

    if (delta !== 0) {
      const categoryLabel = entry.category?.name ?? "Uncategorized";
      const sourceLabel = entry.source?.platform ?? "Unknown";
      stats.categoryTotals.set(categoryLabel, (stats.categoryTotals.get(categoryLabel) ?? 0) + delta);
      stats.sourceTotals.set(sourceLabel, (stats.sourceTotals.get(sourceLabel) ?? 0) + delta);
    }

    daily.set(dateKey, stats);
  });

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  const days: HeatmapDay[] = [];

  for (let current = new Date(start); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    const key = current.toISOString().slice(0, 10);
    const stats = daily.get(key);
    days.push({
      date: key,
      net: stats?.net ?? 0,
      profit: stats?.profit ?? 0,
      loss: stats?.loss ?? 0,
      topCategory: stats ? pickTopLabel(stats.categoryTotals) : null,
      topSource: stats ? pickTopLabel(stats.sourceTotals) : null
    });
  }

  return days;
}

function computeGoalProgress(goal: GoalRow, totals: ReturnType<typeof computePnlTotals>, portfolioTotal: number) {
  const targetValue = Math.abs(toNumber(goal.target_value_usd));
  if (!targetValue) return { progress: 0, achieved: 0 };

  let achieved = 0;
  switch (goal.target_type) {
    case "income":
      achieved = totals.profit;
      break;
    case "net":
      achieved = totals.net;
      break;
    case "portfolio_growth":
      achieved = portfolioTotal;
      break;
    default:
      achieved = 0;
  }

  const ratio = achieved / targetValue;
  return {
    progress: Math.max(0, ratio),
    achieved
  };
}

export async function getDashboardYearData(
  supabase: SupabaseClient,
  userId: string,
  year: number
): Promise<DashboardYearData> {
  const { start, end } = getYearDateRange(year);

  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select(
      "id, entry_date, entry_type, amount_usd_base, notes, category:categories(name), source:sources(platform)"
    )
    .eq("user_id", userId)
    .gte("entry_date", start)
    .lt("entry_date", end)
    .order("entry_date", { ascending: false });

  if (entriesError) {
    throw entriesError;
  }

  const entryRows = (entries ?? []).map((entry) => ({
    ...entry,
    category: Array.isArray(entry.category) ? entry.category[0] ?? null : entry.category,
    source: Array.isArray(entry.source) ? entry.source[0] ?? null : entry.source
  })) as EntryRow[];
  const pnl = computePnlTotals(entryRows);
  const averageMonthlyNet = computeAverageMonthlyNet(entryRows, year);
  const categoryContribution = computeCategoryContribution(entryRows);
  const netSeries = {
    monthly: buildMonthlySeries(entryRows, year),
    quarterly: buildQuarterlySeries(entryRows, year),
    halfYear: buildHalfYearSeries(entryRows, year),
    yearly: buildYearlySeries(pnl.net, year),
    all: buildAllSeries(pnl.net, year)
  };

  const { data: snapshots, error: snapshotError } = await supabase
    .from("portfolio_snapshots")
    .select("snapshot_date, total_value_usd")
    .eq("user_id", userId)
    .gte("snapshot_date", start)
    .lt("snapshot_date", end)
    .order("snapshot_date", { ascending: true });

  if (snapshotError) {
    throw snapshotError;
  }

  const snapshotRows = (snapshots ?? []) as SnapshotRow[];
  const derivedSnapshots = snapshotRows.length === 0 ? buildSnapshotsFromEntries(entryRows) : [];
  const resolvedSnapshots = snapshotRows.length ? snapshotRows : derivedSnapshots;
  const portfolio = computePortfolioStats(resolvedSnapshots);
  const portfolioSeries = buildPortfolioSeries(resolvedSnapshots);

  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select(
      "id, name, purpose, timeframe, target_type, target_value_usd, start_date, end_date, category_id, category:categories(name)"
    )
    .eq("user_id", userId)
    .lte("start_date", end)
    .gte("end_date", start)
    .order("start_date", { ascending: true });

  if (goalsError) {
    throw goalsError;
  }

  const goalRows = (goals ?? []).map((goal) => ({
    ...goal,
    category: Array.isArray(goal.category) ? goal.category[0] ?? null : goal.category
  })) as GoalRow[];
  const targets = goalRows.map((goal) => {
    const scopedEntries = filterEntriesByRange(entryRows, goal.start_date, goal.end_date);
    const scopedTotals = computePnlTotals(scopedEntries);
    const scopedPortfolioValue = getPortfolioValueForRange(
      resolvedSnapshots,
      goal.start_date,
      goal.end_date
    );
    const endLabel = format(new Date(goal.end_date), "MMM d");
    const title = goal.name
      ? goal.name
      : goal.timeframe === "year"
        ? `Target for ${year}`
        : `Target until ${endLabel}`;
    const subtitle = goal.purpose
      ? goal.purpose
      : goal.category?.name
        ? `${goal.category.name} focus`
        : goal.timeframe;

    const { progress, achieved } = computeGoalProgress(goal, scopedTotals, scopedPortfolioValue);

    return {
      id: goal.id,
      title,
      subtitle,
      progress,
      currentValue: achieved,
      targetValue: Math.abs(toNumber(goal.target_value_usd)),
      timeframe: goal.timeframe,
      targetType: goal.target_type,
      startDate: goal.start_date,
      endDate: goal.end_date,
      categoryId: goal.category_id,
      categoryName: goal.category?.name ?? null
    };
  });

  const recentEntries = entryRows.slice(0, 5).map((entry) => ({
    id: entry.id,
    type: entry.entry_type,
    category: entry.category?.name ?? "Uncategorized",
    source: entry.source?.platform ?? "-",
    amount: normalizeAmount(entry),
    date: format(parseISO(entry.entry_date), "yyyy-MM-dd"),
    notes: entry.notes ?? ""
  }));

  const heatmapDays = buildHeatmapDays(entryRows, year);
  const hasTaxOrFee = pnl.fees > 0 || pnl.taxes > 0;

  return {
    year,
    targets,
    portfolio,
    pnl,
    averageMonthlyNet,
    categoryContribution,
    netSeries,
    portfolioSeries,
    recentEntries,
    heatmapDays,
    hasTaxOrFee
  };
}

export async function getAvailableYears(supabase: SupabaseClient, userId: string) {
  const { data: yearRows, error: yearsError } = await supabase
    .from("financial_years")
    .select("year")
    .eq("user_id", userId)
    .order("year", { ascending: true });

  if (yearsError) {
    throw yearsError;
  }

  const yearsFromTable = (yearRows ?? [])
    .map((row) => Number(row.year))
    .filter((year) => Number.isFinite(year));

  const { data: entries, error: entryError } = await supabase
    .from("entries")
    .select("entry_date")
    .eq("user_id", userId);

  if (entryError) {
    return yearsFromTable;
  }

  const derivedYears = new Set<number>();
  (entries ?? []).forEach((entry) => {
    const date = parseISO(entry.entry_date as string);
    derivedYears.add(date.getUTCFullYear());
  });

  const merged = new Set<number>([...yearsFromTable, ...derivedYears]);
  const mergedYears = Array.from(merged).sort((a, b) => a - b);

  const missingYears = Array.from(derivedYears).filter(
    (year) => !yearsFromTable.includes(year)
  );

  if (missingYears.length > 0) {
    await supabase.from("financial_years").upsert(
      missingYears.map((year) => ({ user_id: userId, year })),
      { onConflict: "user_id,year" }
    );
  }

  return mergedYears;
}
