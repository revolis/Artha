import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

<<<<<<< HEAD
import { getAuthenticatedUser } from "@/lib/firebase/route";
import { firebaseAdminDb } from "@/lib/firebase/admin-db";
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing OAuth code or state" }, { status: 400 });
  }

  const cookieStore = cookies();
  const storedState = cookieStore.get("drive_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

<<<<<<< HEAD
=======
  const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "Missing Google Drive OAuth env vars" }, { status: 500 });
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok) {
    return NextResponse.json({ error: "Failed to exchange code" }, { status: 500 });
  }

  let refreshToken = tokenPayload.refresh_token as string | undefined;
  if (!refreshToken) {
<<<<<<< HEAD
    const { data: existingToken } = await firebaseAdminDb
=======
    const { data: existingToken } = await supabaseServer
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
      .from("drive_tokens")
      .select("refresh_token")
      .eq("user_id", user.id)
      .single();

    if (!existingToken?.refresh_token) {
      return NextResponse.json({ error: "No refresh token received" }, { status: 500 });
    }

    refreshToken = existingToken.refresh_token;
  }

<<<<<<< HEAD
  await firebaseAdminDb
=======
  await supabaseServer
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("drive_tokens")
    .upsert({ user_id: user.id, refresh_token: refreshToken });

  cookieStore.set("drive_oauth_state", "", { maxAge: 0, path: "/" });

  return NextResponse.redirect(new URL("/entries?drive=connected", request.url));
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
