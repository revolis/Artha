import { NextResponse } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";
import { getDriveAccessToken } from "@/lib/drive/oauth";

export async function GET() {
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tokenRow } = await supabaseServer
    .from("drive_tokens")
    .select("refresh_token")
    .eq("user_id", data.user.id)
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
