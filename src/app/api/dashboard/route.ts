import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { getAvailableYears, getDashboardYearData } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseRouteClient();
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getUTCFullYear();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const years = await getAvailableYears(supabase, data.user.id);
    const selectedYear = Number.isFinite(year) ? year : new Date().getUTCFullYear();
    const dashboard = await getDashboardYearData(supabase, data.user.id, selectedYear);

    return NextResponse.json({ years, dashboard });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
