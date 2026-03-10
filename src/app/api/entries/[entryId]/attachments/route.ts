import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";

export async function GET(
  _request: NextRequest,
  { params }: { params: { entryId: string } }
) {
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: attachments, error: attachmentsError } = await db
    .from("attachments")
    .select("id, file_name, mime_type, drive_view_link, created_at")
    .eq("entry_id", params.entryId)
    .order("created_at", { ascending: false });

  if (attachmentsError) {
    return NextResponse.json({ error: "Failed to load attachments" }, { status: 500 });
  }

  return NextResponse.json({ attachments: attachments ?? [] });
}


