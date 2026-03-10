import { NextResponse } from "next/server";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: token } = await supabaseServer
    .from("drive_tokens")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ connected: Boolean(token?.refresh_token) });
}
