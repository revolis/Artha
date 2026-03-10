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
  const { data: sources, error: sourcesError } = await db
=======
  const { data: sources, error: sourcesError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("sources")
    .select("id, platform, handle, link, campaign_id")
    .eq("user_id", user.id)
    .order("platform", { ascending: true });

  if (sourcesError) {
    return NextResponse.json({ error: "Failed to load sources" }, { status: 500 });
  }

  return NextResponse.json({ sources: sources ?? [] });
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
  if (!body?.platform) {
    return NextResponse.json({ error: "Missing platform" }, { status: 400 });
  }

<<<<<<< HEAD
  const { data: created, error: insertError } = await db
=======
  const { data: created, error: insertError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("sources")
    .insert({
      user_id: user.id,
      platform: body.platform,
      handle: body.handle || null,
      link: body.link || null,
      campaign_id: body.campaign_id || null
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }

  return NextResponse.json({ source: created });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
