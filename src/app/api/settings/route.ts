import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";

export async function GET(request: NextRequest) {
    const { client: db } = createFirebaseRouteClient();
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
    const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch or create default settings
<<<<<<< HEAD
    const { data, error } = await db
=======
    const { data, error } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned"
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
        // Create defaults
<<<<<<< HEAD
        const { data: newData, error: createError } = await db
=======
        const { data: newData, error: createError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
            .from("user_settings")
            .insert({
                user_id: user.id,
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
<<<<<<< HEAD
    const { client: db } = createFirebaseRouteClient();
=======
    const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    const user = await getAuthenticatedUser();

    if (!user) {
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

<<<<<<< HEAD
    const { data, error } = await db
=======
    const { data, error } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("user_settings")
        .update(upgrades)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
