import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "Missing category name" }, { status: 400 });
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, type")
    .eq("id", params.categoryId)
    .eq("user_id", data.user.id)
    .single();

  if (categoryError || !category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (category.type !== "custom") {
    return NextResponse.json({ error: "System categories cannot be edited" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("categories")
    .update({ name: body.name })
    .eq("id", params.categoryId)
    .eq("user_id", data.user.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }

  return NextResponse.json({ category: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, type")
    .eq("id", params.categoryId)
    .eq("user_id", data.user.id)
    .single();

  if (categoryError || !category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (category.type !== "custom") {
    return NextResponse.json({ error: "System categories cannot be deleted" }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("categories")
    .delete()
    .eq("id", params.categoryId)
    .eq("user_id", data.user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
