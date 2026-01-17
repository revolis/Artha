import { SupabaseClient } from "@supabase/supabase-js";
import { format, startOfWeek, startOfMonth, startOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth, subDays, subWeeks, subMonths, eachYearOfInterval, isSameYear, subYears } from "date-fns";

export type Period = "7d" | "30d" | "3m" | "6m" | "ytd" | "1y" | "all";
export type Grouping = "day" | "week" | "month" | "year";

export async function getAnalyticsData(
    supabase: SupabaseClient,
    userId: string,
    period: Period,
    customStart?: string,
    customEnd?: string
) {
    // 1. Determine Date Range
    const now = new Date();
    let start = new Date();
    let end = new Date(now.getTime()); // Default to current time
    let previousStart = new Date();
    let previousEnd = new Date(); // To calculate growth

    // Calculate date ranges for current and previous periods
    // Both periods use inclusive bounds [start, end] for symmetric comparison
    switch (period) {
        case "7d":
            start = subDays(now, 7);
            previousStart = subDays(start, 7);
            previousEnd = new Date(start.getTime() - 1); // 1ms before start to avoid overlap
            break;
        case "30d":
            start = subDays(now, 30);
            previousStart = subDays(start, 30);
            previousEnd = new Date(start.getTime() - 1);
            break;
        case "3m":
            start = subMonths(now, 3);
            previousStart = subMonths(start, 3);
            previousEnd = new Date(start.getTime() - 1);
            break;
        case "6m":
            start = subMonths(now, 6);
            previousStart = subMonths(start, 6);
            previousEnd = new Date(start.getTime() - 1);
            break;
        case "ytd":
            start = startOfYear(now);
            // Compare to same period in previous year
            previousStart = startOfYear(subYears(now, 1));
            previousEnd = new Date(subYears(end, 1).getTime() - 1);
            break;
        case "1y":
            start = subYears(now, 1);
            previousStart = subYears(start, 1);
            previousEnd = new Date(start.getTime() - 1);
            break;
        case "all":
            // For "all" time, we'll fetch earliest entry date below
            // Temporarily set start to null, will be updated after query
            start = new Date(0); // Placeholder - will be updated
            previousStart = new Date(0);
            previousEnd = new Date(0);
            break;
    }

    // For "all" period, get the earliest entry date from the database
    if (period === "all") {
        const { data: earliestEntry } = await supabase
            .from("entries")
            .select("entry_date")
            .eq("user_id", userId)
            .order("entry_date", { ascending: true })
            .limit(1)
            .single();
        
        if (earliestEntry?.entry_date) {
            start = new Date(earliestEntry.entry_date);
        } else {
            // No entries, default to start of current year
            start = startOfYear(now);
        }
    }

    if (customStart && customEnd) {
        start = new Date(customStart);
        end = new Date(customEnd);
        const duration = end.getTime() - start.getTime();
        previousStart = new Date(start.getTime() - duration);
        previousEnd = new Date(start.getTime() - 1);
    }

    // 2. Fetch Data (Current & Previous)
    // We fetch ALL entries for the ranges. For larger apps, we'd aggregate in SQL.
    // For personal finance (thousands of rows), fetching 1-2k rows is fine.

    const { data: currentEntriesRaw, error: currentError } = await supabase
        .from("entries")
        .select("*, categories(name, type), sources(platform)")
        .eq("user_id", userId)
        .gte("entry_date", start.toISOString())
        .lte("entry_date", end.toISOString())
        .order("entry_date", { ascending: true });

    if (currentError) {
        console.error("Analytics current entries error:", currentError);
        throw new Error("Failed to fetch analytics data: " + currentError.message);
    }

    // For "all" period, skip previous period comparison
    let prevEntriesRaw: any[] | null = null;
    let prevError: any = null;
    
    const hasMeaningfulPrevPeriod = period !== "all" && previousStart.getTime() !== previousEnd.getTime();
    
    if (hasMeaningfulPrevPeriod) {
        const result = await supabase
            .from("entries")
            .select("amount_usd_base, entry_type")
            .eq("user_id", userId)
            .gte("entry_date", previousStart.toISOString())
            .lte("entry_date", previousEnd.toISOString());
        prevEntriesRaw = result.data;
        prevError = result.error;
    }

    if (prevError) {
        console.error("Analytics prev entries error:", prevError);
        throw new Error("Failed to fetch previous period data: " + prevError.message);
    }

    // Normalize entries - Supabase returns arrays for joined tables
    const currentEntries = (currentEntriesRaw ?? []).map((e: any) => ({
        ...e,
        categories: Array.isArray(e.categories) ? e.categories[0] ?? null : e.categories,
        sources: Array.isArray(e.sources) ? e.sources[0] ?? null : e.sources,
    }));
    const prevEntries = prevEntriesRaw ?? [];

    // 3. Process Totals - use Math.abs to normalize amounts (matching dashboard logic)
    const calculateTotals = (entries: any[]) => {
        if (!entries || entries.length === 0) {
            return { income: 0, expenses: 0, net: 0 };
        }
        const income = entries
            .filter(e => e.entry_type === 'profit')
            .reduce((acc, e) => acc + Math.abs(Number(e.amount_usd_base) || 0), 0);
        const expenses = entries
            .filter(e => e.entry_type === 'loss' || e.entry_type === 'fee' || e.entry_type === 'tax')
            .reduce((acc, e) => acc + Math.abs(Number(e.amount_usd_base) || 0), 0);
        return { income, expenses, net: income - expenses };
    };

    const currentTotals = calculateTotals(currentEntries);
    const prevTotals = calculateTotals(prevEntries);

    // 4. Time Series Grouping
    // Determine intuitive grouping based on duration
    const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    let grouping: Grouping = 'day';
    if (durationDays > 365) grouping = 'month';
    else if (durationDays > 90) grouping = 'week'; // or month
    else if (durationDays > 30) grouping = 'day'; // or week

    // Generate intervals
    let intervals: Date[] = [];
    try {
        if (grouping === 'day') intervals = eachDayOfInterval({ start, end });
        else if (grouping === 'week') intervals = eachWeekOfInterval({ start, end });
        else if (grouping === 'month') intervals = eachMonthOfInterval({ start, end });
        else intervals = eachYearOfInterval({ start, end });
    } catch (e) {
        // Fallback if invalid interval
        intervals = [start, end];
    }

    const timeSeries = intervals.map(date => {
        let label = "";
        let filterFn: (d: Date) => boolean = () => false;

        if (grouping === 'day') {
            label = format(date, "MMM d");
            filterFn = (d) => isSameDay(d, date);
        } else if (grouping === 'week') {
            label = format(date, "MMM d");
            filterFn = (d) => isSameWeek(d, date);
        } else if (grouping === 'month') {
            label = format(date, "MMM yyyy");
            filterFn = (d) => isSameMonth(d, date);
        }

        const periodEntries = currentEntries.filter(e => filterFn(new Date(e.entry_date)));
        const stats = calculateTotals(periodEntries);
        return {
            date: date.toISOString(),
            label,
            ...stats
        };
    });

    // 5. Breakdowns

    // By Category - use Math.abs to normalize amounts
    const categoryStats: Record<string, number> = {};
    currentEntries.forEach(e => {
        if (['loss', 'fee', 'tax'].includes(e.entry_type)) {
            const catName = e.categories?.name || "Uncategorized";
            categoryStats[catName] = (categoryStats[catName] || 0) + Math.abs(Number(e.amount_usd_base) || 0);
        }
    });

    const categoryBreakdown = Object.entries(categoryStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10

    // 6. Best/Worst Days (Income/Expense) - sort by absolute values
    const topIncomeFn = (entries: any[]) => entries
        .filter(e => e.entry_type === 'profit')
        .sort((a, b) => Math.abs(Number(b.amount_usd_base) || 0) - Math.abs(Number(a.amount_usd_base) || 0))
        .slice(0, 5);
    const topExpenseFn = (entries: any[]) => entries
        .filter(e => ['loss', 'fee', 'tax'].includes(e.entry_type))
        .sort((a, b) => Math.abs(Number(b.amount_usd_base) || 0) - Math.abs(Number(a.amount_usd_base) || 0))
        .slice(0, 5);

    return {
        totals: {
            ...currentTotals,
            prevIncome: hasMeaningfulPrevPeriod ? prevTotals.income : null,
            prevExpenses: hasMeaningfulPrevPeriod ? prevTotals.expenses : null,
            prevNet: hasMeaningfulPrevPeriod ? prevTotals.net : null
        },
        chartData: timeSeries,
        categoryBreakdown,
        topEntries: {
            income: topIncomeFn(currentEntries),
            expenses: topExpenseFn(currentEntries)
        },
        meta: {
            grouping,
            start,
            end,
            hasPrevPeriod: hasMeaningfulPrevPeriod
        }
    };
}
