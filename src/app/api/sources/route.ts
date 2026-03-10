import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";

export async function GET() {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("id, platform, handle, link, campaign_id")
    .eq("user_id", user.id)
    .order("platform", { ascending: true });

  if (sourcesError) {
    return NextResponse.json({ error: "Failed to load sources" }, { status: 500 });
  }

  return NextResponse.json({ sources: sources ?? [] });
}

export async function POST(request: NextRequest) {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.platform) {
    return NextResponse.json({ error: "Missing platform" }, { status: 400 });
  }

  const { data: created, error: insertError } = await supabase
    .from("sources")
    .insert({
      user_id: user.id,
      platform: body.platform,
      handle: body.handle || null,
      link: body.link || null,
      campaign_id: body.campaign_id || null
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }

  return NextResponse.json({ source: created });
}
