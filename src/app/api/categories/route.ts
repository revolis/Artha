import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";

export async function GET(request: NextRequest) {
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser(request);
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";

export async function GET() {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

<<<<<<< HEAD
  const { data: categories, error: categoriesError } = await db
=======
  const { data: categories, error: categoriesError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("categories")
    .select("id, name, type")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("name", { ascending: true });

  if (categoriesError) {
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }

  return NextResponse.json({ categories: categories ?? [] });
}

export async function POST(request: NextRequest) {
<<<<<<< HEAD
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser(request);
=======
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "Missing category name" }, { status: 400 });
  }

<<<<<<< HEAD
  const { data: created, error: insertError } = await db
=======
  const { data: created, error: insertError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("categories")
    .insert({
      user_id: user.id,
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
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
