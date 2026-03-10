import { SupabaseClient } from "@supabase/supabase-js";
import { 
  format, 
  startOfWeek, 
  startOfMonth, 
  startOfYear, 
  startOfQuarter, 
  endOfMonth, 
  endOfQuarter, 
  eachDayOfInterval, 
  eachWeekOfInterval, 
  eachMonthOfInterval, 
  isSameDay, 
  isSameWeek, 
  isSameMonth, 
  subDays, 
  subMonths, 
  eachYearOfInterval, 
  isSameYear, 
  subYears,
  parseISO
} from "date-fns";

export type Period = "7d" | "30d" | "this_month" | "this_quarter" | "3m" | "6m" | "ytd" | "1y" | "all" | "custom";
export type Grouping = "day" | "week" | "month" | "year";

type EntryRow = {
  id: string;
  entry_date: string;
  entry_type: "profit" | "loss" | "fee" | "tax" | "transfer";
  amount_usd_base: number | string;
  notes: string | null;
  categories: { name: string | null } | { name: string | null }[] | null;
  sources: { platform: string | null } | { platform: string | null }[] | null;
};

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAmount(entry: EntryRow): number {
  return Math.abs(toNumber(entry.amount_usd_base));
}

function isIncome(entry: EntryRow): boolean {
  return entry.entry_type === "profit";
}

function isExpense(entry: EntryRow): boolean {
  return ["loss", "fee", "tax"].includes(entry.entry_type);
}

function getCategoryName(entry: EntryRow): string {
  if (!entry.categories) return "Uncategorized";
  const cat = Array.isArray(entry.categories) ? entry.categories[0] : entry.categories;
  return cat?.name || "Uncategorized";
}

function getSourceName(entry: EntryRow): string {
  if (!entry.sources) return "Direct";
  const src = Array.isArray(entry.sources) ? entry.sources[0] : entry.sources;
  return src?.platform || "Direct";
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getAnalyticsData(
  supabase: SupabaseClient,
  userId: string,
  period: Period,
  customStart?: string,
  customEnd?: string
) {
  const now = new Date();
  
  const { data: dateRangeData } = await supabase
    .from("entries")
    .select("entry_date")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true });

  const allDates = (dateRangeData ?? []).map(e => parseISO(e.entry_date));
  const earliestDate = allDates.length > 0 ? allDates[0] : now;
  const latestDate = allDates.length > 0 ? allDates[allDates.length - 1] : now;
  const effectiveEnd = latestDate > now ? latestDate : now;

  let start = new Date();
  let end = new Date(effectiveEnd);
  let previousStart = new Date();
  let previousEnd = new Date();
  let hasMeaningfulPrevPeriod = true;

  switch (period) {
    case "7d":
      start = subDays(effectiveEnd, 6);
      previousStart = subDays(start, 7);
      previousEnd = subDays(start, 1);
      break;
    case "30d":
      start = subDays(effectiveEnd, 29);
      previousStart = subDays(start, 30);
      previousEnd = subDays(start, 1);
      break;
    case "this_month":
      start = startOfMonth(now);
      end = endOfMonth(now);
      previousStart = startOfMonth(subMonths(now, 1));
      previousEnd = endOfMonth(subMonths(now, 1));
      break;
    case "this_quarter":
      start = startOfQuarter(now);
      end = endOfQuarter(now);
      previousStart = startOfQuarter(subMonths(now, 3));
      previousEnd = endOfQuarter(subMonths(now, 3));
      break;
    case "3m":
      start = subMonths(effectiveEnd, 3);
      previousStart = subMonths(start, 3);
      previousEnd = subDays(start, 1);
      break;
    case "6m":
      start = subMonths(effectiveEnd, 6);
      previousStart = subMonths(start, 6);
      previousEnd = subDays(start, 1);
      break;
    case "ytd":
      start = startOfYear(now);
      end = new Date(now.getFullYear(), 11, 31);
      previousStart = startOfYear(subYears(now, 1));
      previousEnd = new Date(previousStart.getFullYear(), 11, 31);
      break;
    case "1y":
      start = subYears(effectiveEnd, 1);
      previousStart = subYears(start, 1);
      previousEnd = subDays(start, 1);
      break;
    case "all":
      start = earliestDate;
      end = latestDate;
      hasMeaningfulPrevPeriod = false;
      break;
  }

  if (customStart && customEnd) {
    start = parseISO(customStart);
    end = parseISO(customEnd);
    const duration = end.getTime() - start.getTime();
    previousStart = new Date(start.getTime() - duration);
    previousEnd = subDays(start, 1);
  }

  const startStr = toDateString(start);
  const endStr = toDateString(end);

  let currentEntriesRaw: any[] | null = null;
  let currentError: any = null;

  if (period === "all" && !customStart && !customEnd) {
    const result = await supabase
      .from("entries")
      .select("id, entry_date, entry_type, amount_usd_base, notes, categories(name), sources(platform)")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true });
    currentEntriesRaw = result.data;
    currentError = result.error;
  } else {
    const result = await supabase
      .from("entries")
      .select("id, entry_date, entry_type, amount_usd_base, notes, categories(name), sources(platform)")
      .eq("user_id", userId)
      .gte("entry_date", startStr)
      .lte("entry_date", endStr)
      .order("entry_date", { ascending: true });
    currentEntriesRaw = result.data;
    currentError = result.error;
  }

  if (currentError) {
    throw new Error("Failed to fetch analytics data: " + currentError.message);
  }

  const currentEntries: EntryRow[] = (currentEntriesRaw ?? []).map((e: any) => ({
    ...e,
    categories: Array.isArray(e.categories) ? e.categories[0] : e.categories,
    sources: Array.isArray(e.sources) ? e.sources[0] : e.sources,
  }));

  if (period === "all" && currentEntries.length > 0) {
    const entryDates = currentEntries.map(e => parseISO(e.entry_date)).filter(d => !isNaN(d.getTime()));
    if (entryDates.length > 0) {
      start = entryDates.reduce((min, d) => d < min ? d : min, entryDates[0]);
      end = entryDates.reduce((max, d) => d > max ? d : max, entryDates[0]);
    }
  }

  let prevTotals = { income: 0, expenses: 0, net: 0 };
  
  if (hasMeaningfulPrevPeriod && previousStart.getTime() < previousEnd.getTime()) {
    const prevStartStr = toDateString(previousStart);
    const prevEndStr = toDateString(previousEnd);
    
    const { data: prevEntriesRaw } = await supabase
      .from("entries")
      .select("entry_type, amount_usd_base")
      .eq("user_id", userId)
      .gte("entry_date", prevStartStr)
      .lte("entry_date", prevEndStr);

    (prevEntriesRaw ?? []).forEach((e: any) => {
      const amount = Math.abs(toNumber(e.amount_usd_base));
      if (e.entry_type === "profit") {
        prevTotals.income += amount;
      } else if (["loss", "fee", "tax"].includes(e.entry_type)) {
        prevTotals.expenses += amount;
      }
    });
    prevTotals.net = prevTotals.income - prevTotals.expenses;
  } else {
    hasMeaningfulPrevPeriod = false;
  }

  let totalIncome = 0;
  let totalExpenses = 0;
  
  currentEntries.forEach(entry => {
    const amount = getAmount(entry);
    if (isIncome(entry)) {
      totalIncome += amount;
    } else if (isExpense(entry)) {
      totalExpenses += amount;
    }
  });

  const totalNet = totalIncome - totalExpenses;

  const durationDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  let grouping: Grouping = "day";
  if (durationDays > 730) grouping = "year";
  else if (durationDays > 180) grouping = "month";
  else if (durationDays > 60) grouping = "week";

  let intervals: Date[] = [];
  try {
    if (grouping === "day") intervals = eachDayOfInterval({ start, end });
    else if (grouping === "week") intervals = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    else if (grouping === "month") intervals = eachMonthOfInterval({ start, end });
    else intervals = eachYearOfInterval({ start, end });
  } catch {
    intervals = [start];
  }

  const chartData = intervals.map(intervalDate => {
    let label = "";
    let filterFn: (d: Date) => boolean;

    switch (grouping) {
      case "day":
        label = format(intervalDate, "MMM d");
        filterFn = (d) => isSameDay(d, intervalDate);
        break;
      case "week":
        label = format(intervalDate, "MMM d");
        filterFn = (d) => isSameWeek(d, intervalDate, { weekStartsOn: 1 });
        break;
      case "month":
        label = format(intervalDate, "MMM yyyy");
        filterFn = (d) => isSameMonth(d, intervalDate);
        break;
      default:
        label = format(intervalDate, "yyyy");
        filterFn = (d) => isSameYear(d, intervalDate);
    }

    let periodIncome = 0;
    let periodExpenses = 0;

    currentEntries.forEach(entry => {
      const entryDate = parseISO(entry.entry_date);
      if (!filterFn(entryDate)) return;
      
      const amount = getAmount(entry);
      if (isIncome(entry)) {
        periodIncome += amount;
      } else if (isExpense(entry)) {
        periodExpenses += amount;
      }
    });

    return {
      date: intervalDate.toISOString(),
      label,
      income: periodIncome,
      expenses: periodExpenses,
      net: periodIncome - periodExpenses
    };
  });

  const expenseCategoryStats: Record<string, number> = {};
  const incomeCategoryStats: Record<string, number> = {};
  const sourceStats: Record<string, { income: number; expenses: number }> = {};

  currentEntries.forEach(entry => {
    const amount = getAmount(entry);
    const catName = getCategoryName(entry);
    const srcName = getSourceName(entry);

    if (!sourceStats[srcName]) {
      sourceStats[srcName] = { income: 0, expenses: 0 };
    }

    if (isIncome(entry)) {
      incomeCategoryStats[catName] = (incomeCategoryStats[catName] || 0) + amount;
      sourceStats[srcName].income += amount;
    } else if (isExpense(entry)) {
      expenseCategoryStats[catName] = (expenseCategoryStats[catName] || 0) + amount;
      sourceStats[srcName].expenses += amount;
    }
  });

  const categoryBreakdown = Object.entries(expenseCategoryStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const incomeBreakdown = Object.entries(incomeCategoryStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const sourceBreakdown = Object.entries(sourceStats)
    .map(([name, data]) => ({ name, ...data, net: data.income - data.expenses }))
    .sort((a, b) => b.net - a.net);

  const incomeEntries = currentEntries.filter(isIncome);
  const expenseEntries = currentEntries.filter(isExpense);

  const transactionStats = {
    totalTransactions: currentEntries.length,
    incomeCount: incomeEntries.length,
    expenseCount: expenseEntries.length,
    avgIncome: incomeEntries.length > 0 ? totalIncome / incomeEntries.length : 0,
    avgExpense: expenseEntries.length > 0 ? totalExpenses / expenseEntries.length : 0,
    largestIncome: incomeEntries.length > 0 ? Math.max(...incomeEntries.map(getAmount)) : 0,
    largestExpense: expenseEntries.length > 0 ? Math.max(...expenseEntries.map(getAmount)) : 0,
  };

  const savingsRate = totalIncome > 0 ? (totalNet / totalIncome) * 100 : 0;
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  const monthlyData: Record<string, { income: number; expenses: number; net: number }> = {};
  
  currentEntries.forEach(entry => {
    const monthKey = format(parseISO(entry.entry_date), "yyyy-MM");
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0, net: 0 };
    }
    
    const amount = getAmount(entry);
    if (isIncome(entry)) {
      monthlyData[monthKey].income += amount;
    } else if (isExpense(entry)) {
      monthlyData[monthKey].expenses += amount;
    }
  });

  Object.keys(monthlyData).forEach(key => {
    monthlyData[key].net = monthlyData[key].income - monthlyData[key].expenses;
  });

  const monthlyTrends = Object.entries(monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const bestMonth = monthlyTrends.length > 0
    ? monthlyTrends.reduce((best, curr) => curr.net > best.net ? curr : best)
    : null;
  const worstMonth = monthlyTrends.length > 0
    ? monthlyTrends.reduce((worst, curr) => curr.net < worst.net ? curr : worst)
    : null;

  const topIncomeEntries = [...incomeEntries]
    .sort((a, b) => getAmount(b) - getAmount(a))
    .slice(0, 5);

  const topExpenseEntries = [...expenseEntries]
    .sort((a, b) => getAmount(b) - getAmount(a))
    .slice(0, 5);

  return {
    totals: {
      income: totalIncome,
      expenses: totalExpenses,
      net: totalNet,
      prevIncome: hasMeaningfulPrevPeriod ? prevTotals.income : null,
      prevExpenses: hasMeaningfulPrevPeriod ? prevTotals.expenses : null,
      prevNet: hasMeaningfulPrevPeriod ? prevTotals.net : null
    },
    chartData,
    categoryBreakdown,
    incomeBreakdown,
    sourceBreakdown,
    transactionStats,
    financialRatios: {
      savingsRate,
      expenseRatio,
    },
    monthlyTrends,
    insights: {
      bestMonth,
      worstMonth,
    },
    topEntries: {
      income: topIncomeEntries,
      expenses: topExpenseEntries
    },
    meta: {
      grouping,
      start,
      end,
      hasPrevPeriod: hasMeaningfulPrevPeriod,
      entryCount: currentEntries.length
    }
  };
}
