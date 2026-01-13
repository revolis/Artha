import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
    const supabase = createSupabaseRouteClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch or create default settings
    const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.user.id)
        .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned"
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
        // Create defaults
        const { data: newData, error: createError } = await supabase
            .from("user_settings")
            .insert({
                user_id: user.user.id,
                display_currency_mode: "usd",
                fx_mode: "stored_only",
                private_mode_default: false
            })
            .select()
            .single();

        if (createError) {
            return NextResponse.json({ error: "Failed to init settings" }, { status: 500 });
        }
        return NextResponse.json({ settings: newData });
    }

    return NextResponse.json({ settings: data });
}

export async function PATCH(request: NextRequest) {
    const supabase = createSupabaseRouteClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    // Validate allowed fields
    const allowed = ['display_currency_mode', 'fx_mode', 'fx_manual_rate_usd_npr', 'private_mode_default'];
    const upgrades: any = {};

    for (const key of allowed) {
        if (body[key] !== undefined) upgrades[key] = body[key];
    }

    const { data, error } = await supabase
        .from("user_settings")
        .update(upgrades)
        .eq("user_id", user.user.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
}
