import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { startOfYear, endOfYear } from "date-fns";

export async function GET(request: NextRequest) {
    const { client: supabase } = createSupabaseRouteClient();
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const formatType = searchParams.get("format") || "csv";
    const year = searchParams.get("year");

    let startDate: Date;
    let endDate: Date;

    if (year) {
        startDate = startOfYear(new Date(parseInt(year), 0, 1));
        endDate = endOfYear(new Date(parseInt(year), 0, 1));
    } else {
        startDate = new Date(0);
        endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 10);
    }

    const { data: entries } = await supabase
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

    if (formatType === 'json') {
        return new NextResponse(JSON.stringify(entries, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="tax-fees-${year || 'all'}.json"`
            }
        });
    }

    // CSV
    const headers = ["Date", "Type", "Category", "Amount (USD)", "Exchange", "Notes"];
    const rows = (entries || []).map((e: any) => [
        e.entry_date,
        e.entry_type,
        e.categories?.name || "Uncategorized",
        e.amount_usd_base,
        e.trade_details?.exchange || "",
        `"${(e.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="tax-fees-${year || 'all'}.csv"`
        }
    });
}
