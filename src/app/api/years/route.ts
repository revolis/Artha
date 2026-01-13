import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { getAvailableYears } from "@/lib/supabase/queries";

export async function GET() {
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const years = await getAvailableYears(supabase, data.user.id);
    return NextResponse.json({ years });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load years" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const year = Number(body?.year);
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from("financial_years")
    .upsert({ user_id: data.user.id, year }, { onConflict: "user_id,year" });

  if (insertError) {
    return NextResponse.json({ error: "Failed to create year" }, { status: 500 });
  }

  try {
    const years = await getAvailableYears(supabase, data.user.id);
    return NextResponse.json({ years });
  } catch (err) {
    return NextResponse.json({ years: [year] });
  }
}
