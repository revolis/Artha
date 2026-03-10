import { NextResponse } from "next/server";

import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
import { firebaseAdminDb } from "@/lib/firebase/admin-db";

export async function GET() {
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: token } = await firebaseAdminDb
    .from("drive_tokens")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ connected: Boolean(token?.refresh_token) });
}



