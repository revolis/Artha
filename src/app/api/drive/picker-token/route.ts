import { NextResponse } from "next/server";

<<<<<<< HEAD
import { getAuthenticatedUser } from "@/lib/firebase/route";
import { firebaseAdminDb } from "@/lib/firebase/admin-db";
import { getDriveAccessToken } from "@/lib/drive/oauth";

export async function GET() {
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";
import { getDriveAccessToken } from "@/lib/drive/oauth";

export async function GET() {
  const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

<<<<<<< HEAD
  const { data: tokenRow } = await firebaseAdminDb
=======
  const { data: tokenRow } = await supabaseServer
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("drive_tokens")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  if (!tokenRow?.refresh_token) {
    return NextResponse.json({ error: "Google Drive not connected" }, { status: 400 });
  }

  try {
    const accessToken = await getDriveAccessToken(tokenRow.refresh_token);
    return NextResponse.json({ access_token: accessToken });
  } catch (err) {
    return NextResponse.json({ error: "Failed to get access token" }, { status: 500 });
  }
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
