import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
<<<<<<< HEAD
  const { client: db } = createFirebaseRouteClient();
=======
  const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "Missing category name" }, { status: 400 });
  }

<<<<<<< HEAD
  const { data: category, error: categoryError } = await db
=======
  const { data: category, error: categoryError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("categories")
    .select("id, type")
    .eq("id", params.categoryId)
    .eq("user_id", user.id)
    .single();

  if (categoryError || !category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (category.type !== "custom") {
    return NextResponse.json({ error: "System categories cannot be edited" }, { status: 400 });
  }

<<<<<<< HEAD
  const { data: updated, error: updateError } = await db
=======
  const { data: updated, error: updateError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("categories")
    .update({ name: body.name })
    .eq("id", params.categoryId)
    .eq("user_id", user.id)
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
<<<<<<< HEAD
  const { client: db } = createFirebaseRouteClient();
=======
  const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

<<<<<<< HEAD
  const { data: category, error: categoryError } = await db
=======
  const { data: category, error: categoryError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("categories")
    .select("id, type")
    .eq("id", params.categoryId)
    .eq("user_id", user.id)
    .single();

  if (categoryError || !category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (category.type !== "custom") {
    return NextResponse.json({ error: "System categories cannot be deleted" }, { status: 400 });
  }

<<<<<<< HEAD
  const { data: linkedEntries, error: linkedEntriesError } = await db
    .from("entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("category_id", params.categoryId)
    .limit(1);

  if (linkedEntriesError) {
    return NextResponse.json({ error: "Failed to validate category usage" }, { status: 500 });
  }

  if ((linkedEntries ?? []).length > 0) {
    return NextResponse.json(
      { error: "Category is currently used by existing entries" },
      { status: 400 }
    );
  }

  const { error: deleteError } = await db
=======
  const { error: deleteError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("categories")
    .delete()
    .eq("id", params.categoryId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
