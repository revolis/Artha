import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
import { getAvailableYears, getDashboardYearData } from "@/lib/firebase/queries";
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { getAvailableYears, getDashboardYearData } from "@/lib/supabase/queries";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getUTCFullYear();

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

  try {
<<<<<<< HEAD
    const years = await getAvailableYears(db, user.id);
    const selectedYear = Number.isFinite(year) ? year : new Date().getUTCFullYear();
    const dashboard = await getDashboardYearData(db, user.id, selectedYear);
=======
    const years = await getAvailableYears(supabase, user.id);
    const selectedYear = Number.isFinite(year) ? year : new Date().getUTCFullYear();
    const dashboard = await getDashboardYearData(supabase, user.id, selectedYear);
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

    return NextResponse.json({ years, dashboard });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
