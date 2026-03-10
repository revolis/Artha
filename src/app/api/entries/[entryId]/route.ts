import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
import { firebaseAdminDb } from "@/lib/firebase/admin-db";
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
import { getDriveAccessToken } from "@/lib/drive/oauth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { entryId: string } }
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
  const { data: entry, error: entryError } = await db
=======
  const { data: entry, error: entryError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("entries")
    .select(
      "id, entry_date, entry_type, amount_usd_base, currency_original, amount_original, fx_rate_used, notes, category_id, source_id, entry_tags(tag_id)"
    )
    .eq("id", params.entryId)
    .eq("user_id", user.id)
    .single();

  if (entryError) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { entryId: string } }
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

  const amount = Number(body.amount_usd_base);
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const payload = {
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
  const { data: updated, error: updateError } = await db
=======
  const { data: updated, error: updateError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("entries")
    .update(payload)
    .eq("id", params.entryId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError) {
<<<<<<< HEAD
    if (updateError.code === "PGRST116") {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }

  if (Array.isArray(body.tag_ids)) {
    const tagIds = Array.from(new Set(body.tag_ids.filter((id: unknown) => typeof id === "string")));

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
    await db.from("entry_tags").delete().eq("entry_id", params.entryId);
    if (validTagIds.length > 0) {
      await db.from("entry_tags").insert(
        validTagIds.map((tagId: string) => ({
=======
    const validTagIds = (tags ?? []).map((tag) => tag.id);
    await supabase.from("entry_tags").delete().eq("entry_id", params.entryId);
    if (validTagIds.length > 0) {
      await supabase.from("entry_tags").insert(
        validTagIds.map((tagId) => ({
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
          entry_id: params.entryId,
          tag_id: tagId
        }))
      );
    }
  }

  return NextResponse.json({ entry: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { entryId: string } }
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
  const { data: entry, error: entryError } = await db
    .from("entries")
    .select("id")
    .eq("id", params.entryId)
    .eq("user_id", user.id)
    .single();

  if (entryError || !entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const { data: attachments } = await db
    .from("attachments")
    .select("id, drive_file_id")
    .eq("entry_id", params.entryId);

  const { error: attachmentDeleteError } = await db
    .from("attachments")
    .delete()
    .eq("entry_id", params.entryId);

  if (attachmentDeleteError) {
    return NextResponse.json({ error: "Failed to delete entry attachments" }, { status: 500 });
  }

  const { error: entryTagDeleteError } = await db
    .from("entry_tags")
    .delete()
    .eq("entry_id", params.entryId);

  if (entryTagDeleteError) {
    return NextResponse.json({ error: "Failed to delete entry tags" }, { status: 500 });
  }

  const { error: tradeDetailsDeleteError } = await db
    .from("trade_details")
    .delete()
    .eq("entry_id", params.entryId);

  if (tradeDetailsDeleteError) {
    return NextResponse.json({ error: "Failed to delete trade details" }, { status: 500 });
  }

  const { error: deleteError } = await db
=======
  const { data: attachments } = await supabase
    .from("attachments")
    .select("drive_file_id")
    .eq("entry_id", params.entryId);

  const { error: deleteError } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .from("entries")
    .delete()
    .eq("id", params.entryId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }

  const driveFileIds = (attachments ?? [])
<<<<<<< HEAD
    .map((attachment: { drive_file_id?: string | null }) => attachment.drive_file_id)
=======
    .map((attachment) => attachment.drive_file_id)
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    .filter(Boolean) as string[];

  const storageErrors: string[] = [];
  if (driveFileIds.length > 0) {
<<<<<<< HEAD
    const { data: tokenRow } = await firebaseAdminDb
=======
    const { data: tokenRow } = await supabaseServer
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
      .from("drive_tokens")
      .select("refresh_token")
      .eq("user_id", user.id)
      .single();

    if (!tokenRow?.refresh_token) {
      storageErrors.push(...driveFileIds);
    } else {
      try {
        const accessToken = await getDriveAccessToken(tokenRow.refresh_token);
        for (const fileId of driveFileIds) {
          const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (!response.ok && response.status !== 404) {
            storageErrors.push(fileId);
          }
        }
      } catch (err) {
        storageErrors.push(...driveFileIds);
      }
    }
  }

  return NextResponse.json({ ok: true, storageErrors });
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
