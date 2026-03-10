import { NextResponse } from "next/server";

<<<<<<< HEAD
import { getAuthenticatedUser } from "@/lib/firebase/route";
import { firebaseAdminDb } from "@/lib/firebase/admin-db";

export async function GET() {
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

<<<<<<< HEAD
  const { data: token } = await firebaseAdminDb
=======
  const { data: token } = await supabaseServer
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("drive_tokens")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ connected: Boolean(token?.refresh_token) });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
