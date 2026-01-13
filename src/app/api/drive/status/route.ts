import { NextResponse } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: token } = await supabaseServer
    .from("drive_tokens")
    .select("refresh_token")
    .eq("user_id", data.user.id)
    .single();

  return NextResponse.json({ connected: Boolean(token?.refresh_token) });
}
