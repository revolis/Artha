import { NextResponse } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";

export async function GET() {
  const { client: db } = createFirebaseRouteClient();
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";

export async function GET() {
  const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

<<<<<<< HEAD
  const { data: entries, error: entriesError } = await db
=======
  const { data: entries, error: entriesError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("entries")
    .select("id")
    .eq("user_id", user.id)
    .in("entry_type", ["tax", "fee"])
    .limit(1);

  if (entriesError) {
    return NextResponse.json({ error: "Failed to check tax and fees" }, { status: 500 });
  }

  return NextResponse.json({ available: (entries ?? []).length > 0 });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
