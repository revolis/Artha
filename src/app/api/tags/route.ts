import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";

export async function GET() {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (tagsError) {
    return NextResponse.json({ error: "Failed to load tags" }, { status: 500 });
  }

  return NextResponse.json({ tags: tags ?? [] });
}

export async function POST(request: NextRequest) {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "Missing tag name" }, { status: 400 });
  }

  const { data: created, error: insertError } = await supabase
    .from("tags")
    .insert({
      user_id: user.id,
      name: body.name
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }

  return NextResponse.json({ tag: created });
}
