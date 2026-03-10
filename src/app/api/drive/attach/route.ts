import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";

type DriveFilePayload = {
  id: string;
  name: string;
  mimeType?: string;
  url?: string;
  embedUrl?: string;
  webViewLink?: string;
};

export async function POST(request: NextRequest) {
  const { client: supabase } = createSupabaseRouteClient();
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

  const payload = files
    .filter((file) => file.id && file.name)
    .map((file) => ({
      entry_id: entryId,
      drive_file_id: file.id,
      file_name: file.name,
      mime_type: file.mimeType || "application/octet-stream",
      drive_view_link: file.webViewLink || file.url || file.embedUrl || null
    }));

  if (payload.length === 0) {
    return NextResponse.json({ error: "No valid files" }, { status: 400 });
  }

  const { data: attachments, error: insertError } = await supabase
    .from("attachments")
    .insert(payload)
    .select()
    .order("created_at", { ascending: false });

  if (insertError) {
    return NextResponse.json({ error: "Failed to attach files" }, { status: 500 });
  }

  return NextResponse.json({ attachments: attachments ?? [] });
}
