import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";
import { getDriveAccessToken } from "@/lib/drive/oauth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { entryId: string; attachmentId: string } }
) {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: attachment, error: attachmentError } = await supabase
    .from("attachments")
    .select("drive_file_id")
    .eq("id", params.attachmentId)
    .eq("entry_id", params.entryId)
    .single();

  if (attachmentError || !attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  const { data: tokenRow } = await supabaseServer
    .from("drive_tokens")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  if (!tokenRow?.refresh_token) {
    return NextResponse.json({ error: "Google Drive not connected" }, { status: 400 });
  }

  try {
    const accessToken = await getDriveAccessToken(tokenRow.refresh_token);
    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${attachment.drive_file_id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!driveResponse.ok && driveResponse.status !== 404) {
      return NextResponse.json({ error: "Failed to delete Drive file" }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete Drive file" }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("attachments")
    .delete()
    .eq("id", params.attachmentId)
    .eq("entry_id", params.entryId);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
