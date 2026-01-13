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
    let end = new Date();
    let previousStart = new Date();
    let previousEnd = new Date(); // To calculate growth

    // Simple period logic (can be refined)
    switch (period) {
        case "7d":
            start = subDays(now, 7);
            previousStart = subDays(start, 7);
            previousEnd = start;
            break;
        case "30d":
            start = subDays(now, 30);
            previousStart = subDays(start, 30);
            previousEnd = start;
            break;
        case "3m":
            start = subMonths(now, 3);
            previousStart = subMonths(start, 3);
            previousEnd = start;
            break;
        case "6m":
            start = subMonths(now, 6);
            previousStart = subMonths(start, 6);
            previousEnd = start;
            break;
        case "ytd":
            start = startOfYear(now);
            previousStart = startOfYear(subYears(now, 1)); // Compare to prev year same period? or just prev period?
            // Usually YTD compares to Prev YTD
            previousEnd = subYears(now, 1); // No wait, compare to prev year same date range
            // Actually simpler: just compare to previous equivalent duration? 
            // Let's stick to simple "previous period of same length" for now or Prev Year?
            // Let's do previous period for simplicity unless YTD.
            previousStart = subDays(start, 1); // rough fallback
            break;
        case "1y":
            start = subYears(now, 1);
            previousStart = subYears(start, 1);
            previousEnd = start;
            break;
        case "all":
            start = new Date(0); // Beginning of time
            break;
    }

    if (customStart && customEnd) {
        start = new Date(customStart);
        end = new Date(customEnd);
        // Calc duration
        const duration = end.getTime() - start.getTime();
        previousEnd = start;
        previousStart = new Date(start.getTime() - duration);
    }

    // 2. Fetch Data (Current & Previous)
    // We fetch ALL entries for the ranges. For larger apps, we'd aggregate in SQL.
    // For personal finance (thousands of rows), fetching 1-2k rows is fine.

    const { data: currentEntries } = await supabase
        .from("entries")
        .select("*, categories(name, type), sources(platform)")
        .eq("user_id", userId)
        .gte("entry_date", start.toISOString())
        .lte("entry_date", end.toISOString())
        .order("entry_date", { ascending: true });

    const { data: prevEntries } = await supabase
        .from("entries")
        .select("amount_usd_base, entry_type")
        .eq("user_id", userId)
        .gte("entry_date", previousStart.toISOString())
        .lt("entry_date", previousEnd.toISOString());

    // 3. Process Totals
    const calculateTotals = (entries: any[]) => {
        const income = entries?.filter(e => e.entry_type === 'profit').reduce((acc, e) => acc + Number(e.amount_usd_base), 0) || 0;
        const expenses = entries?.filter(e => e.entry_type === 'loss' || e.entry_type === 'fee' || e.entry_type === 'tax').reduce((acc, e) => acc + Number(e.amount_usd_base), 0) || 0;
        return { income, expenses, net: income - expenses };
    };

    const currentTotals = calculateTotals(currentEntries || []);
    const prevTotals = calculateTotals(prevEntries || []);

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

        const periodEntries = currentEntries?.filter(e => filterFn(new Date(e.entry_date)));
        const stats = calculateTotals(periodEntries || []);
        return {
            date: date.toISOString(),
            label,
            ...stats
        };
    });

    // 5. Breakdowns

    // By Category
    const categoryStats: Record<string, number> = {};
    currentEntries?.forEach(e => {
        if (e.entry_type !== 'loss') return; // Expense breakdown primarily? Or handle income separately?
        // Usually breakdown is for Expenses OR Income. Let's do Expenses by default or separate.
        // Let's do Net impact per category? Usually users want "Where did my money go?" (Expenses)
        if (['loss', 'fee', 'tax'].includes(e.entry_type)) {
            const catName = e.categories?.name || "Uncategorized";
            categoryStats[catName] = (categoryStats[catName] || 0) + Number(e.amount_usd_base);
        }
    });

    const categoryBreakdown = Object.entries(categoryStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10

    // 6. Best/Worst Days (Income/Expense)
    // We can just sort the currentEntries
    const topIncomeFn = (entries: any[]) => entries.filter(e => e.entry_type === 'profit').sort((a, b) => Number(b.amount_usd_base) - Number(a.amount_usd_base)).slice(0, 5);
    const topExpenseFn = (entries: any[]) => entries.filter(e => ['loss', 'fee', 'tax'].includes(e.entry_type)).sort((a, b) => Number(b.amount_usd_base) - Number(a.amount_usd_base)).slice(0, 5);

    return {
        totals: {
            ...currentTotals,
            prevIncome: prevTotals.income,
            prevExpenses: prevTotals.expenses,
            prevNet: prevTotals.net
        },
        chartData: timeSeries,
        categoryBreakdown,
        topEntries: {
            income: topIncomeFn(currentEntries || []),
            expenses: topExpenseFn(currentEntries || [])
        },
        meta: {
            grouping,
            start,
            end
        }
    };
}
