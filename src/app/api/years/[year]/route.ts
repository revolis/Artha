import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";
import { getDriveAccessToken } from "@/lib/drive/oauth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { year: string } }
) {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = Number(params.year);
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const { data: summary, error: summaryError } = await supabase
    .rpc("get_year_delete_summary", { p_year: year })
    .single();

  if (summaryError) {
    return NextResponse.json({ error: "Failed to load delete summary" }, { status: 500 });
  }

  const summaryRow = summary as {
    entries_count?: number;
    goals_count?: number;
    attachments_count?: number;
    snapshots_count?: number;
  };

  return NextResponse.json({
    year,
    entries: summaryRow.entries_count ?? 0,
    goals: summaryRow.goals_count ?? 0,
    attachments: summaryRow.attachments_count ?? 0,
    snapshots: summaryRow.snapshots_count ?? 0
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { year: string } }
) {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = Number(params.year);
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const { data: deletion, error: deleteError } = await supabase
    .rpc("delete_financial_year", { p_year: year })
    .single();

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete year" }, { status: 500 });
  }

  const deletionRow = deletion as {
    entries_deleted?: number;
    goals_deleted?: number;
    attachments_deleted?: number;
    snapshots_deleted?: number;
    drive_file_ids?: string[];
  };

  const driveFileIds = (deletionRow?.drive_file_ids ?? []) as string[];
  const storageErrors: string[] = [];

  if (driveFileIds.length > 0) {
    const { data: tokenRow } = await supabaseServer
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

  return NextResponse.json({
    ok: true,
    deleted: {
      entries: deletionRow?.entries_deleted ?? 0,
      goals: deletionRow?.goals_deleted ?? 0,
      attachments: deletionRow?.attachments_deleted ?? 0,
      snapshots: deletionRow?.snapshots_deleted ?? 0
    },
    storageErrors
  });
}
