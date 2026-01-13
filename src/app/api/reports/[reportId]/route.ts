import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function GET(
    request: NextRequest,
    { params }: { params: { reportId: string } }
) {
    const supabase = createSupabaseRouteClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", params.reportId)
        .eq("user_id", user.user.id)
        .single();

    if (error) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report: data });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { reportId: string } }
) {
    const supabase = createSupabaseRouteClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", params.reportId)
        .eq("user_id", user.user.id);

    if (error) {
        return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { reportId: string } }
) {
    const supabase = createSupabaseRouteClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    if (typeof body?.share_enabled !== 'boolean') {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updates: any = {
        share_enabled: body.share_enabled
    };

    if (body.share_enabled) {
        // Generate token if not exists (handled by DB default or logic here)
        // Using nanoid or crypto for token
        updates.share_token = crypto.randomUUID();
    } else {
        updates.share_token = null;
    }

    const { data, error } = await supabase
        .from("reports")
        .update(updates)
        .eq("id", params.reportId)
        .eq("user_id", user.user.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ report: data });
}
