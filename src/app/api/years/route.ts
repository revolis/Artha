import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
import { getAvailableYears } from "@/lib/firebase/queries";

export async function GET() {
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const years = await getAvailableYears(db, user.id);
    return NextResponse.json({ years });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load years" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { client: db } = createFirebaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const year = Number(body?.year);
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const { error: insertError } = await db
    .from("financial_years")
    .upsert({ user_id: user.id, year }, { onConflict: "user_id,year" });

  if (insertError) {
    return NextResponse.json({ error: "Failed to create year" }, { status: 500 });
  }

  try {
    const years = await getAvailableYears(db, user.id);
    return NextResponse.json({ years });
  } catch (err) {
    return NextResponse.json({ years: [year] });
  }
}


