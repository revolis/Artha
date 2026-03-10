import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

type DriveFilePayload = {
  id: string;
  name: string;
  mimeType?: string;
  url?: string;
  embedUrl?: string;
  webViewLink?: string;
};

export async function POST(request: NextRequest) {
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
  const entryId = body?.entry_id as string | undefined;
  const files = body?.files as DriveFilePayload[] | undefined;

  if (!entryId || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "Missing entry_id or files" }, { status: 400 });
  }

<<<<<<< HEAD
  const { data: entry } = await db
    .from("entries")
    .select("id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const payload = files
    .filter((file) => file.id && file.name)
    .map((file) => ({
      user_id: user.id,
=======
  const payload = files
    .filter((file) => file.id && file.name)
    .map((file) => ({
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
      entry_id: entryId,
      drive_file_id: file.id,
      file_name: file.name,
      mime_type: file.mimeType || "application/octet-stream",
      drive_view_link: file.webViewLink || file.url || file.embedUrl || null
    }));

  if (payload.length === 0) {
    return NextResponse.json({ error: "No valid files" }, { status: 400 });
  }

<<<<<<< HEAD
  const { data: attachments, error: insertError } = await db
=======
  const { data: attachments, error: insertError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("attachments")
    .insert(payload)
    .select()
    .order("created_at", { ascending: false });

  if (insertError) {
    return NextResponse.json({ error: "Failed to attach files" }, { status: 500 });
  }

  return NextResponse.json({ attachments: attachments ?? [] });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
