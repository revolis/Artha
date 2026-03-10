import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { tagId: string } }
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
=======
  const { error: deleteError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("tags")
    .delete()
    .eq("id", params.tagId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
