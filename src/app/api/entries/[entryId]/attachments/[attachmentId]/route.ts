import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
import { firebaseAdminDb } from "@/lib/firebase/admin-db";
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
import { getDriveAccessToken } from "@/lib/drive/oauth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { entryId: string; attachmentId: string } }
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
  const { data: entry, error: entryError } = await db
    .from("entries")
    .select("id")
    .eq("id", params.entryId)
    .eq("user_id", user.id)
    .single();

  if (entryError || !entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const { data: attachment, error: attachmentError } = await db
=======
  const { data: attachment, error: attachmentError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("attachments")
    .select("drive_file_id")
    .eq("id", params.attachmentId)
    .eq("entry_id", params.entryId)
    .single();

  if (attachmentError || !attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

<<<<<<< HEAD
  const { data: tokenRow } = await firebaseAdminDb
=======
  const { data: tokenRow } = await supabaseServer
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
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

<<<<<<< HEAD
  const { error: deleteError } = await db
=======
  const { error: deleteError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("attachments")
    .delete()
    .eq("id", params.attachmentId)
    .eq("entry_id", params.entryId);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
