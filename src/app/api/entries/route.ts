import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { getYearDateRange, getAvailableYears } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getUTCFullYear();
  const { start, end } = getYearDateRange(Number.isFinite(year) ? year : new Date().getUTCFullYear());

  const { data: entries, error: entriesError } = await supabase
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

  const normalizedEntries = (entries ?? []).map((entry) => ({
    ...entry,
    category: Array.isArray(entry.category) ? entry.category[0] ?? null : entry.category,
    source: Array.isArray(entry.source) ? entry.source[0] ?? null : entry.source
  }));

  try {
    const years = await getAvailableYears(supabase, user.id);
    return NextResponse.json({ entries: normalizedEntries, years });
  } catch (err) {
    return NextResponse.json({ entries: normalizedEntries, years: [] });
  }
}

export async function POST(request: NextRequest) {
  const { client: supabase } = createSupabaseRouteClient();
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

  const { data: created, error: insertError } = await supabase
    .from("entries")
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }

  const entryYear = new Date(payload.entry_date).getUTCFullYear();
  if (Number.isFinite(entryYear)) {
    await supabase
      .from("financial_years")
      .upsert({ user_id: user.id, year: entryYear }, { onConflict: "user_id,year" });
  }

  const tagIds = Array.isArray(body.tag_ids)
    ? Array.from(new Set(body.tag_ids.filter((id: unknown) => typeof id === "string")))
    : [];

  if (tagIds.length > 0) {
    const { data: tags } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", user.id)
      .in("id", tagIds);

    const validTagIds = (tags ?? []).map((tag) => tag.id);
    if (validTagIds.length > 0) {
      await supabase.from("entry_tags").insert(
        validTagIds.map((tagId) => ({
          entry_id: created.id,
          tag_id: tagId
        }))
      );
    }
  }

  return NextResponse.json({ entry: created });
}
