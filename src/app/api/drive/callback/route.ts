import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";

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

  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
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
    const { data: existingToken } = await supabaseServer
      .from("drive_tokens")
      .select("refresh_token")
      .eq("user_id", data.user.id)
      .single();

    if (!existingToken?.refresh_token) {
      return NextResponse.json({ error: "No refresh token received" }, { status: 500 });
    }

    refreshToken = existingToken.refresh_token;
  }

  await supabaseServer
    .from("drive_tokens")
    .upsert({ user_id: data.user.id, refresh_token: refreshToken });

  cookieStore.set("drive_oauth_state", "", { maxAge: 0, path: "/" });

  return NextResponse.redirect(new URL("/entries?drive=connected", request.url));
}
