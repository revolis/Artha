import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

export async function PUT(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
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
  if (!body) {
    return NextResponse.json({ error: "Missing payload" }, { status: 400 });
  }

  const targetValue = Number(body.target_value_usd);
  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    return NextResponse.json({ error: "Invalid target value" }, { status: 400 });
  }

  const payload = {
    timeframe: body.timeframe,
    target_type: body.target_type,
    target_value_usd: targetValue,
    start_date: body.start_date,
    end_date: body.end_date,
    category_id: body.category_id || null
  };

<<<<<<< HEAD
  const { data: updated, error: updateError } = await db
=======
  const { data: updated, error: updateError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("goals")
    .update(payload)
    .eq("id", params.goalId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }

  return NextResponse.json({ goal: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { goalId: string } }
) {
<<<<<<< HEAD
  const { client: db } = createFirebaseRouteClient();
=======
  const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

<<<<<<< HEAD
  const { error: deleteError } = await db
=======
  const { error: deleteError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("goals")
    .delete()
    .eq("id", params.goalId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
