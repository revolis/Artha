import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, type")
    .or(`user_id.eq.${data.user.id},user_id.is.null`)
    .order("name", { ascending: true });

  if (categoriesError) {
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }

  return NextResponse.json({ categories: categories ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "Missing category name" }, { status: 400 });
  }

  const { data: created, error: insertError } = await supabase
    .from("categories")
    .insert({
      user_id: data.user.id,
      name: body.name,
      type: "custom"
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }

  return NextResponse.json({ category: created });
}
