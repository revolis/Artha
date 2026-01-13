import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Missing Google Drive OAuth env vars" }, { status: 500 });
  }

  const scope = encodeURIComponent("https://www.googleapis.com/auth/drive.file");
  const state = randomUUID();
  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth" +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&response_type=code" +
    `&scope=${scope}` +
    "&access_type=offline" +
    "&prompt=consent" +
    `&state=${state}`;

  const response = NextResponse.json({ url: authUrl, state });
  response.cookies.set("drive_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10
  });
  return response;
}
