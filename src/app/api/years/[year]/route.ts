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

  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const [entriesResult, goalsResult, snapshotsResult] = await Promise.all([
      supabase
        .from("entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate),
      supabase
        .from("goals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("year", year),
      supabase
        .from("portfolio_snapshots")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("snapshot_date", startDate)
        .lte("snapshot_date", endDate)
    ]);

    const { data: entryIds } = await supabase
      .from("entries")
      .select("id")
      .eq("user_id", user.id)
      .gte("entry_date", startDate)
      .lte("entry_date", endDate);

    let attachmentsCount = 0;
    if (entryIds && entryIds.length > 0) {
      const { count } = await supabase
        .from("attachments")
        .select("id", { count: "exact", head: true })
        .in("entry_id", entryIds.map(e => e.id));
      attachmentsCount = count || 0;
    }

    return NextResponse.json({
      year,
      entries: entriesResult.count ?? 0,
      goals: goalsResult.count ?? 0,
      attachments: attachmentsCount,
      snapshots: snapshotsResult.count ?? 0
    });
  } catch (error) {
    console.error("Year summary error:", error);
    return NextResponse.json({ error: "Failed to load delete summary" }, { status: 500 });
  }
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

  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: entryIds } = await supabase
      .from("entries")
      .select("id")
      .eq("user_id", user.id)
      .gte("entry_date", startDate)
      .lte("entry_date", endDate);

    let attachmentsDeleted = 0;
    let driveFileIds: string[] = [];

    if (entryIds && entryIds.length > 0) {
      const ids = entryIds.map(e => e.id);

      const { data: attachments } = await supabase
        .from("attachments")
        .select("id, drive_file_id")
        .in("entry_id", ids);

      if (attachments) {
        driveFileIds = attachments
          .filter(a => a.drive_file_id)
          .map(a => a.drive_file_id as string);

        const { count } = await supabase
          .from("attachments")
          .delete()
          .in("entry_id", ids)
          .select("id", { count: "exact", head: true });
        attachmentsDeleted = count || attachments.length;
      }
    }

    const [entriesResult, goalsResult, snapshotsResult] = await Promise.all([
      supabase
        .from("entries")
        .delete()
        .eq("user_id", user.id)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate)
        .select("id", { count: "exact", head: true }),
      supabase
        .from("goals")
        .delete()
        .eq("user_id", user.id)
        .eq("year", year)
        .select("id", { count: "exact", head: true }),
      supabase
        .from("portfolio_snapshots")
        .delete()
        .eq("user_id", user.id)
        .gte("snapshot_date", startDate)
        .lte("snapshot_date", endDate)
        .select("id", { count: "exact", head: true })
    ]);

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
        entries: entriesResult.count ?? 0,
        goals: goalsResult.count ?? 0,
        attachments: attachmentsDeleted,
        snapshots: snapshotsResult.count ?? 0
      },
      storageErrors
    });
  } catch (error) {
    console.error("Year delete error:", error);
    return NextResponse.json({ error: "Failed to delete year" }, { status: 500 });
  }
}
