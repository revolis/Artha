import { NextResponse } from "next/server";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";

export async function GET() {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("id")
    .eq("user_id", user.id)
    .in("entry_type", ["tax", "fee"])
    .limit(1);

  if (entriesError) {
    return NextResponse.json({ error: "Failed to check tax and fees" }, { status: 500 });
  }

  return NextResponse.json({ available: (entries ?? []).length > 0 });
}
