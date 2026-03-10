import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";

export async function GET(
    request: NextRequest,
    { params }: { params: { reportId: string } }
) {
    const { client: supabase } = createSupabaseRouteClient();
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch report definition
    const { data: report, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", params.reportId)
        .eq("user_id", user.id)
        .single();

    if (error || !report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Re-generate content
    // Note: Duplicated logic from POST /reports. Ideally refactor later into shared lib.
    const { data: entries } = await supabase
        .from("entries")
        .select("*, categories(name)")
        .eq("user_id", user.id)
        .gte("entry_date", report.range_start)
        .lte("entry_date", report.range_end);

    if (report.export_format === 'json') {
        const jsonContent = JSON.stringify({
            meta: report,
            data: entries
        }, null, 2);

        return new NextResponse(jsonContent, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="report-${report.range_start}-${report.report_type}.json"`
            }
        });
    }

    if (report.export_format === 'csv') {
        const headers = ["Date", "Type", "Category", "Amount", "Currency", "Notes"];
        const rows = (entries || []).map((e: any) => [
            e.entry_date,
            e.entry_type,
            e.categories?.name || "Uncategorized",
            e.amount_usd_base,
            "USD",
            `"${(e.notes || "").replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="report-${report.range_start}-${report.report_type}.csv"`
            }
        });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}
