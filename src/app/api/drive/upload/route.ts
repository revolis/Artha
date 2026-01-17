import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";
import { getDriveAccessToken } from "@/lib/drive/oauth";

export async function POST(request: NextRequest) {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const entryId = formData.get("entry_id");

  if (!file || typeof file === "string" || !entryId || typeof entryId !== "string") {
    return NextResponse.json({ error: "Missing file or entry_id" }, { status: 400 });
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
    const boundary = `----rabin-drive-${randomUUID()}`;
    const metadata = {
      name: file.name,
      mimeType: file.type || "application/octet-stream"
    };

    const encoder = new TextEncoder();
    const chunks = [
      encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
      encoder.encode(`${JSON.stringify(metadata)}\r\n`),
      encoder.encode(`--${boundary}\r\nContent-Type: ${metadata.mimeType}\r\n\r\n`),
      new Uint8Array(await (file as File).arrayBuffer()),
      encoder.encode(`\r\n--${boundary}--`)
    ];

    const uploadResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`
        },
        body: new Blob(chunks)
      }
    );

    if (!uploadResponse.ok) {
      return NextResponse.json({ error: "Drive upload failed" }, { status: 500 });
    }

    const driveFile = await uploadResponse.json();

    const { data: attachment, error: attachmentError } = await supabase
      .from("attachments")
      .insert({
        entry_id: entryId,
        drive_file_id: driveFile.id,
        file_name: driveFile.name,
        mime_type: driveFile.mimeType,
        drive_view_link: driveFile.webViewLink || null
      })
      .select()
      .single();

    if (attachmentError) {
      return NextResponse.json({ error: "Failed to store attachment" }, { status: 500 });
    }

    return NextResponse.json({ attachment });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
