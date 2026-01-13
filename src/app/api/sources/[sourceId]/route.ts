import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function PUT(
  request: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.platform) {
    return NextResponse.json({ error: "Missing platform" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("sources")
    .update({
      platform: body.platform,
      handle: body.handle || null,
      link: body.link || null,
      campaign_id: body.campaign_id || null
    })
    .eq("id", params.sourceId)
    .eq("user_id", data.user.id)
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
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error: deleteError } = await supabase
    .from("sources")
    .delete()
    .eq("id", params.sourceId)
    .eq("user_id", data.user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete source" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
