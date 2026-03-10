import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
import { getYearDateRange, getAvailableYears } from "@/lib/firebase/queries";

export async function GET(request: NextRequest) {
  const { client: db } = createFirebaseRouteClient();
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { getYearDateRange, getAvailableYears } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getUTCFullYear();
  const { start, end } = getYearDateRange(Number.isFinite(year) ? year : new Date().getUTCFullYear());

<<<<<<< HEAD
  const { data: entries, error: entriesError } = await db
=======
  const { data: entries, error: entriesError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("entries")
    .select(
      "id, entry_date, entry_type, amount_usd_base, notes, category:categories(id, name), source:sources(id, platform)"
    )
    .eq("user_id", user.id)
    .gte("entry_date", start)
    .lt("entry_date", end)
    .order("entry_date", { ascending: false });

  if (entriesError) {
    return NextResponse.json({ error: "Failed to load entries" }, { status: 500 });
  }

<<<<<<< HEAD
  const normalizedEntries = (entries ?? []).map((entry: any) => ({
=======
  const normalizedEntries = (entries ?? []).map((entry) => ({
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    ...entry,
    category: Array.isArray(entry.category) ? entry.category[0] ?? null : entry.category,
    source: Array.isArray(entry.source) ? entry.source[0] ?? null : entry.source
  }));

  try {
<<<<<<< HEAD
    const years = await getAvailableYears(db, user.id);
=======
    const years = await getAvailableYears(supabase, user.id);
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    return NextResponse.json({ entries: normalizedEntries, years });
  } catch (err) {
    return NextResponse.json({ entries: normalizedEntries, years: [] });
  }
}

export async function POST(request: NextRequest) {
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
  if (!body?.entry_date || !body?.entry_type || !body?.category_id || body?.amount_usd_base == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const amount = Number(body.amount_usd_base);
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const payload = {
    user_id: user.id,
    entry_date: body.entry_date,
    entry_type: body.entry_type,
    category_id: body.category_id,
    source_id: body.source_id || null,
    amount_usd_base: amount,
    currency_original: body.currency_original || null,
    amount_original: body.amount_original || null,
    fx_rate_used: body.fx_rate_used || null,
    notes: body.notes || null
  };

<<<<<<< HEAD
  const { data: created, error: insertError } = await db
=======
  const { data: created, error: insertError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("entries")
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }

  const entryYear = new Date(payload.entry_date).getUTCFullYear();
  if (Number.isFinite(entryYear)) {
<<<<<<< HEAD
    await db
=======
    await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
      .from("financial_years")
      .upsert({ user_id: user.id, year: entryYear }, { onConflict: "user_id,year" });
  }

  const tagIds = Array.isArray(body.tag_ids)
    ? Array.from(new Set(body.tag_ids.filter((id: unknown) => typeof id === "string")))
    : [];

  if (tagIds.length > 0) {
<<<<<<< HEAD
    const { data: tags } = await db
=======
    const { data: tags } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
      .from("tags")
      .select("id")
      .eq("user_id", user.id)
      .in("id", tagIds);

<<<<<<< HEAD
    const validTagIds = (tags ?? []).map((tag: { id: string }) => tag.id);
    if (validTagIds.length > 0) {
      await db.from("entry_tags").insert(
        validTagIds.map((tagId: string) => ({
=======
    const validTagIds = (tags ?? []).map((tag) => tag.id);
    if (validTagIds.length > 0) {
      await supabase.from("entry_tags").insert(
        validTagIds.map((tagId) => ({
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
          entry_id: created.id,
          tag_id: tagId
        }))
      );
    }
  }

  return NextResponse.json({ entry: created });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
