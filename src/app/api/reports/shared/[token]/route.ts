import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    // Public route - use Service Role client to bypass RLS
    // We strictly filter by token and share_enabled=true

    const { data: report, error } = await supabaseServer
        .from("reports")
        .select("*")
        .eq("share_token", params.token)
        .eq("share_enabled", true)
        .single();

    if (error || !report) {
        return NextResponse.json({ error: "Report not found or not shared" }, { status: 404 });
    }

    // Fetch the data for this report using the service client
    // Since we are trusted here (token verified), we fetch the user's entries
    const { data: entries } = await supabaseServer
        .from("entries")
        .select("*, categories(*)")
        .eq("user_id", report.user_id)
        .gte("entry_date", report.range_start)
        .lte("entry_date", report.range_end)
        .order("entry_date", { ascending: false });

    // Calculate summary stats if report type is summary
    let summary = null;
    if (report.report_type === 'summary') {
        const income = entries?.filter((e: any) => e.entry_type === 'profit').reduce((sum: number, e: any) => sum + Number(e.amount_usd_base), 0) || 0;
        const expense = entries?.filter((e: any) => e.entry_type === 'loss').reduce((sum: number, e: any) => sum + Number(e.amount_usd_base), 0) || 0;

        summary = {
            total_income: income,
            total_expense: expense,
            net_income: income - expense,
            entries_count: entries?.length || 0
        };
    }

    return NextResponse.json({
        report,
        data: entries,
        summary,
        public: true
    });
}
