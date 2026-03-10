import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

export async function GET(
    request: NextRequest,
    { params }: { params: { reportId: string } }
) {
<<<<<<< HEAD
    const { client: db } = createFirebaseRouteClient();
=======
    const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

<<<<<<< HEAD
    const { data, error } = await db
=======
    const { data, error } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("reports")
        .select("*")
        .eq("id", params.reportId)
        .eq("user_id", user.id)
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
<<<<<<< HEAD
    const { client: db } = createFirebaseRouteClient();
=======
    const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

<<<<<<< HEAD
    const { error } = await db
=======
    const { error } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("reports")
        .delete()
        .eq("id", params.reportId)
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { reportId: string } }
) {
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

<<<<<<< HEAD
    const { data, error } = await db
=======
    const { data, error } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("reports")
        .update(updates)
        .eq("id", params.reportId)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ report: data });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
