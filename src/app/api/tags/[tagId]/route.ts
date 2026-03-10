import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userEntries, error: userEntriesError } = await db
    .from("entries")
    .select("id")
    .eq("user_id", user.id);

  if (userEntriesError) {
    return NextResponse.json({ error: "Failed to validate tag usage" }, { status: 500 });
  }

  const userEntryIds = (userEntries ?? []).map((entry: { id: string }) => entry.id);
  if (userEntryIds.length > 0) {
    const { error: deleteLinksError } = await db
      .from("entry_tags")
      .delete()
      .eq("tag_id", params.tagId)
      .in("entry_id", userEntryIds);

    if (deleteLinksError) {
      return NextResponse.json({ error: "Failed to delete tag references" }, { status: 500 });
    }
  }

  const { error: deleteError } = await db
    .from("tags")
    .delete()
    .eq("id", params.tagId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}


