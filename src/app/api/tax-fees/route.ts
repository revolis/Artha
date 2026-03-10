import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { startOfYear, endOfYear, format } from "date-fns";

export async function GET(request: NextRequest) {
    const { client: supabase } = createSupabaseRouteClient();
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");

    let startDate: Date;
    let endDate: Date;

    if (year) {
        startDate = startOfYear(new Date(parseInt(year), 0, 1));
        endDate = endOfYear(new Date(parseInt(year), 0, 1));
    } else {
        // Default to "All Time" or current year? usually All Time for summary
        // Let's do All Time effectively
        startDate = new Date(0);
        endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 10); // Future proof
    }

    try {
        // 1. Fetch Tax and Fee Entries
        const { data: entries, error } = await supabase
            .from("entries")
            .select(`
            *,
            categories(name),
            trade_details(exchange, fee_amount, fee_currency)
        `)
            .eq("user_id", user.id)
            .in("entry_type", ["tax", "fee"])
            .gte("entry_date", startDate.toISOString())
            .lte("entry_date", endDate.toISOString())
            .order("entry_date", { ascending: false });

        if (error) throw error;

        // 2. Aggregate Data
        let totalTax = 0;
        let totalFees = 0;
        const categoryMap: Record<string, { tax: number; fee: number }> = {};
        const exchangeMap: Record<string, { fee: number; count: number }> = {};

        entries?.forEach(entry => {
            const amount = Number(entry.amount_usd_base);
            const catName = entry.categories?.name || "Uncategorized";

            if (!categoryMap[catName]) categoryMap[catName] = { tax: 0, fee: 0 };

            if (entry.entry_type === "tax") {
                totalTax += amount;
                categoryMap[catName].tax += amount;
            } else {
                totalFees += amount;
                categoryMap[catName].fee += amount;
            }

            // Exchange breakdown (if trade details exist)
            if (entry.trade_details?.exchange) {
                const exName = entry.trade_details.exchange;
                if (!exchangeMap[exName]) exchangeMap[exName] = { fee: 0, count: 0 };
                exchangeMap[exName].fee += amount;
                exchangeMap[exName].count += 1;
            }
        });

        // Format for UI
        const categoryBreakdown = Object.entries(categoryMap)
            .map(([name, stats]) => ({
                name,
                tax: stats.tax,
                fee: stats.fee,
                total: stats.tax + stats.fee
            }))
            .sort((a, b) => b.total - a.total);

        const exchangeBreakdown = Object.entries(exchangeMap)
            .map(([name, stats]) => ({
                name,
                amount: stats.fee,
                count: stats.count
            }))
            .sort((a, b) => b.amount - a.amount);

        return NextResponse.json({
            totals: {
                tax: totalTax,
                fees: totalFees,
                combined: totalTax + totalFees
            },
            categoryBreakdown,
            exchangeBreakdown,
            entries: entries // Send limited details or full? UI might show recent list.
        });

    } catch (err: any) {
        console.error("Tax/Fees Error:", err);
        return NextResponse.json({ error: "Failed to load tax & fees data" }, { status: 500 });
    }
}
