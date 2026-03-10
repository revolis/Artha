import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

export async function GET(
  _request: NextRequest,
  { params }: { params: { entryId: string } }
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

  const { data: attachments, error: attachmentsError } = await db
=======
  const { data: attachments, error: attachmentsError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("attachments")
    .select("id, file_name, mime_type, drive_view_link, created_at")
    .eq("entry_id", params.entryId)
    .order("created_at", { ascending: false });

  if (attachmentsError) {
    return NextResponse.json({ error: "Failed to load attachments" }, { status: 500 });
  }

  return NextResponse.json({ attachments: attachments ?? [] });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
