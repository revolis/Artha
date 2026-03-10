import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
import { firebaseAdminDb } from "@/lib/firebase/admin-db";
import { getDriveAccessToken } from "@/lib/drive/oauth";

type AttachmentRow = {
  id?: string;
  entry_id?: string | null;
  user_id?: string | null;
};

async function getOwnedAttachmentIdsForFile(
  db: ReturnType<typeof createFirebaseRouteClient>["client"],
  userId: string,
  fileId: string
) {
  const { data: attachments, error: attachmentsError } = await db
    .from("attachments")
    .select("id, entry_id, user_id")
    .eq("drive_file_id", fileId);

  if (attachmentsError || !attachments || attachments.length === 0) {
    return [];
  }

  const rows = attachments as AttachmentRow[];
  const ownedAttachmentIds = new Set<string>();
  const unresolvedEntryIds: string[] = [];

  rows.forEach((attachment) => {
    if (!attachment.id) {
      return;
    }

    if (attachment.user_id && attachment.user_id === userId) {
      ownedAttachmentIds.add(attachment.id);
      return;
    }

    if (!attachment.user_id && attachment.entry_id) {
      unresolvedEntryIds.push(attachment.entry_id);
    }
  });

  const uniqueEntryIds = Array.from(new Set(unresolvedEntryIds));
  if (uniqueEntryIds.length > 0) {
    const { data: ownedEntries } = await db
      .from("entries")
      .select("id")
      .eq("user_id", userId)
      .in("id", uniqueEntryIds);

    const ownedEntryIds = new Set((ownedEntries ?? []).map((entry: { id: string }) => entry.id));

    rows.forEach((attachment) => {
      if (!attachment.id || !attachment.entry_id) {
        return;
      }

      if (ownedEntryIds.has(attachment.entry_id)) {
        ownedAttachmentIds.add(attachment.id);
      }
    });
  }

  return Array.from(ownedAttachmentIds);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const fileId = params.fileId;
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownedAttachmentIds = await getOwnedAttachmentIdsForFile(db, user.id, fileId);
  if (ownedAttachmentIds.length === 0) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { data: tokenRow } = await firebaseAdminDb
    .from("drive_tokens")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  if (!tokenRow?.refresh_token) {
    return NextResponse.json({ error: "Drive not connected" }, { status: 400 });
  }

  try {
    const accessToken = await getDriveAccessToken(tokenRow.refresh_token);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,webContentLink,thumbnailLink`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      return NextResponse.json({ error: "Failed to fetch file from Drive" }, { status: response.status });
    }

    const fileData = await response.json();
    return NextResponse.json(fileData);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const fileId = params.fileId;
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownedAttachmentIds = await getOwnedAttachmentIdsForFile(db, user.id, fileId);
  if (ownedAttachmentIds.length === 0) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { data: tokenRow } = await firebaseAdminDb
    .from("drive_tokens")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  if (!tokenRow?.refresh_token) {
    return NextResponse.json({ error: "Drive not connected" }, { status: 400 });
  }

  try {
    const accessToken = await getDriveAccessToken(tokenRow.refresh_token);

    const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!driveResponse.ok && driveResponse.status !== 404) {
      return NextResponse.json({ error: "Failed to delete from Drive" }, { status: driveResponse.status });
    }

    const { error: dbError } = await db
      .from("attachments")
      .delete()
      .in("id", ownedAttachmentIds);

    if (dbError) {
      return NextResponse.json({ error: "Failed to delete attachment record" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
