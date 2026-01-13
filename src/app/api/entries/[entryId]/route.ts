import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";
import { getDriveAccessToken } from "@/lib/drive/oauth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { entryId: string } }
) {
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: entry, error: entryError } = await supabase
    .from("entries")
    .select(
      "id, entry_date, entry_type, amount_usd_base, currency_original, amount_original, fx_rate_used, notes, category_id, source_id, entry_tags(tag_id)"
    )
    .eq("id", params.entryId)
    .eq("user_id", data.user.id)
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
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
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

  const { data: updated, error: updateError } = await supabase
    .from("entries")
    .update(payload)
    .eq("id", params.entryId)
    .eq("user_id", data.user.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }

  if (Array.isArray(body.tag_ids)) {
    const tagIds = Array.from(new Set(body.tag_ids.filter((id: unknown) => typeof id === "string")));

    const { data: tags } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", data.user.id)
      .in("id", tagIds);

    const validTagIds = (tags ?? []).map((tag) => tag.id);
    await supabase.from("entry_tags").delete().eq("entry_id", params.entryId);
    if (validTagIds.length > 0) {
      await supabase.from("entry_tags").insert(
        validTagIds.map((tagId) => ({
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
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: attachments } = await supabase
    .from("attachments")
    .select("drive_file_id")
    .eq("entry_id", params.entryId);

  const { error: deleteError } = await supabase
    .from("entries")
    .delete()
    .eq("id", params.entryId)
    .eq("user_id", data.user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }

  const driveFileIds = (attachments ?? [])
    .map((attachment) => attachment.drive_file_id)
    .filter(Boolean) as string[];

  const storageErrors: string[] = [];
  if (driveFileIds.length > 0) {
    const { data: tokenRow } = await supabaseServer
      .from("drive_tokens")
      .select("refresh_token")
      .eq("user_id", data.user.id)
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
