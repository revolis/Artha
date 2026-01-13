import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
    const supabase = createSupabaseRouteClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports: data });
}

export async function POST(request: NextRequest) {
    const supabase = createSupabaseRouteClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.range_start || !body?.range_end || !body?.report_type || !body?.export_format) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { range_start, range_end, report_type, export_format } = body;

    try {
        // 1. Generate Report Data (Logic will reside here or in a separate lib function)
        const reportData = await generateReportData(supabase, user.user.id, range_start, range_end, report_type);

        // 2. Generate Content based on format
        let content = "";
        let mimeType = "";
        if (export_format === 'json') {
            content = JSON.stringify(reportData, null, 2);
            mimeType = "application/json";
        } else {
            content = convertToCSV(reportData);
            mimeType = "text/csv";
        }

        // 3. Save Report Metadata to Database
        // Note: For a real app, we'd upload 'content' to Supabase Storage and switch 'generated_file_url'
        // For now, we'll simulating saving metadata. Real file storage is implied for 'generated_file_url'
        // but the requirement says "CSV/JSON download", we can serve purely from API or store.
        // Given the simplified scope, let's assume we generate on fly for download or store metadata.
        // Best practice: Upload to storage.
        // For this MVP step, we will create the DB record.

        const { data: report, error: dbError } = await supabase
            .from("reports")
            .insert({
                user_id: user.user.id,
                range_start,
                range_end,
                report_type,
                export_format,
                share_enabled: false
            })
            .select()
            .single();

        if (dbError) {
            throw dbError;
        }

        return NextResponse.json({ report });

    } catch (err) {
        console.error("Report generation failed:", err);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}

// Helpers (mock implementation for structure, can move to lib)
async function generateReportData(supabase: any, userId: string, start: string, end: string, type: string) {
    // Fetch entries in range
    const { data: entries } = await supabase
        .from("entries")
        .select("*, categories(*)")
        .eq("user_id", userId)
        .gte("entry_date", start)
        .lte("entry_date", end);

    if (type === 'summary') {
        // Group by category, calculate totals
        return {
            type: 'summary',
            period: { start, end },
            total_income: entries?.filter((e: any) => e.entry_type === 'profit').reduce((sum: number, e: any) => sum + Number(e.amount_usd_base), 0) || 0,
            total_expense: entries?.filter((e: any) => e.entry_type === 'loss').reduce((sum: number, e: any) => sum + Number(e.amount_usd_base), 0) || 0,
            entries_count: entries?.length || 0,
            entries: entries // Include detailed entries? maybe simplified
        };
    }

    // Implement other types later
    return { type, entries };
}

function convertToCSV(data: any) {
    if (!data.entries) return "";
    const headers = ["Date", "Type", "Category", "Amount (USD)", "Notes"];
    const rows = data.entries.map((e: any) => [
        e.entry_date,
        e.entry_type,
        e.categories?.name || "",
        e.amount_usd_base,
        `"${(e.notes || "").replace(/"/g, '""')}"`
    ]);
    return [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
}
