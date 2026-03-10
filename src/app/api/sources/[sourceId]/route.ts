import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

export async function PUT(
  request: NextRequest,
  { params }: { params: { sourceId: string } }
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
  if (!body?.platform) {
    return NextResponse.json({ error: "Missing platform" }, { status: 400 });
  }

<<<<<<< HEAD
  const { data: updated, error: updateError } = await db
=======
  const { data: updated, error: updateError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("sources")
    .update({
      platform: body.platform,
      handle: body.handle || null,
      link: body.link || null,
      campaign_id: body.campaign_id || null
    })
    .eq("id", params.sourceId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Failed to update source" }, { status: 500 });
  }

  return NextResponse.json({ source: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { sourceId: string } }
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
  const { error: unlinkError } = await db
    .from("entries")
    .update({ source_id: null })
    .eq("user_id", user.id)
    .eq("source_id", params.sourceId);

  if (unlinkError) {
    return NextResponse.json({ error: "Failed to unlink source from entries" }, { status: 500 });
  }

  const { error: deleteError } = await db
=======
  const { error: deleteError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("sources")
    .delete()
    .eq("id", params.sourceId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete source" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
