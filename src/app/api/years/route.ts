import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
import { getAvailableYears } from "@/lib/firebase/queries";

export async function GET() {
  const { client: db } = createFirebaseRouteClient();
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { getAvailableYears } from "@/lib/supabase/queries";

export async function GET() {
  const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
<<<<<<< HEAD
    const years = await getAvailableYears(db, user.id);
=======
    const years = await getAvailableYears(supabase, user.id);
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    return NextResponse.json({ years });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load years" }, { status: 500 });
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
  const year = Number(body?.year);
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

<<<<<<< HEAD
  const { error: insertError } = await db
=======
  const { error: insertError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("financial_years")
    .upsert({ user_id: user.id, year }, { onConflict: "user_id,year" });

  if (insertError) {
    return NextResponse.json({ error: "Failed to create year" }, { status: 500 });
  }

  try {
<<<<<<< HEAD
    const years = await getAvailableYears(db, user.id);
=======
    const years = await getAvailableYears(supabase, user.id);
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    return NextResponse.json({ years });
  } catch (err) {
    return NextResponse.json({ years: [year] });
  }
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
