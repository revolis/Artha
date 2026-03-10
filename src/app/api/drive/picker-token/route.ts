import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/firebase/route";
import { firebaseAdminDb } from "@/lib/firebase/admin-db";
import { getDriveAccessToken } from "@/lib/drive/oauth";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tokenRow } = await firebaseAdminDb
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


