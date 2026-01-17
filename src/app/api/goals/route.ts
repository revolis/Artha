import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { getDashboardYearData } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const parsedYear = yearParam ? Number(yearParam) : new Date().getUTCFullYear();
  const year = Number.isFinite(parsedYear) ? parsedYear : new Date().getUTCFullYear();

  try {
    const dashboard = await getDashboardYearData(supabase, user.id, year);
    return NextResponse.json({ goals: dashboard.targets });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load goals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.timeframe || !body?.target_type || body?.target_value_usd == null || !body?.start_date || !body?.end_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const targetValue = Number(body.target_value_usd);
  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    return NextResponse.json({ error: "Invalid target value" }, { status: 400 });
  }

  const payload = {
    user_id: user.id,
    timeframe: body.timeframe,
    target_type: body.target_type,
    target_value_usd: targetValue,
    start_date: body.start_date,
    end_date: body.end_date,
    category_id: body.category_id || null
  };

  const { data: created, error: insertError } = await supabase
    .from("goals")
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }

  const goalYear = new Date(payload.start_date).getUTCFullYear();
  if (Number.isFinite(goalYear)) {
    await supabase
      .from("financial_years")
      .upsert({ user_id: user.id, year: goalYear }, { onConflict: "user_id,year" });
  }

  return NextResponse.json({ goal: created });
}
