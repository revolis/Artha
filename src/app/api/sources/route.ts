import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("id, platform, handle, link, campaign_id")
    .eq("user_id", data.user.id)
    .order("platform", { ascending: true });

  if (sourcesError) {
    return NextResponse.json({ error: "Failed to load sources" }, { status: 500 });
  }

  return NextResponse.json({ sources: sources ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.platform) {
    return NextResponse.json({ error: "Missing platform" }, { status: 400 });
  }

  const { data: created, error: insertError } = await supabase
    .from("sources")
    .insert({
      user_id: data.user.id,
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
