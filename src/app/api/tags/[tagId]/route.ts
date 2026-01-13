import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error: deleteError } = await supabase
    .from("tags")
    .delete()
    .eq("id", params.tagId)
    .eq("user_id", data.user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
