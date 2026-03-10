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
  { params }: { params: { year: string } }
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

  const year = Number(params.year);
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const [entriesData, goalsData, snapshotsData] = await Promise.all([
<<<<<<< HEAD
      db
=======
      supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("entries")
        .select("id")
        .eq("user_id", user.id)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate),
<<<<<<< HEAD
      db
=======
      supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("goals")
        .select("id")
        .eq("user_id", user.id)
        .eq("year", year),
<<<<<<< HEAD
      db
=======
      supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("portfolio_snapshots")
        .select("id")
        .eq("user_id", user.id)
        .gte("snapshot_date", startDate)
        .lte("snapshot_date", endDate)
    ]);

    const entryIds = entriesData.data || [];
    let attachmentsCount = 0;
    if (entryIds.length > 0) {
<<<<<<< HEAD
      const { data: attachments } = await db
        .from("attachments")
        .select("id")
        .in("entry_id", entryIds.map((e: { id: string }) => e.id));
=======
      const { data: attachments } = await supabase
        .from("attachments")
        .select("id")
        .in("entry_id", entryIds.map(e => e.id));
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
      attachmentsCount = attachments?.length || 0;
    }

    return NextResponse.json({
      year,
      entries: entryIds.length,
      goals: goalsData.data?.length ?? 0,
      attachments: attachmentsCount,
      snapshots: snapshotsData.data?.length ?? 0
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
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

<<<<<<< HEAD
  const db = firebaseAdminDb;
=======
  const supabase = supabaseServer;
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

  const year = Number(params.year);
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

<<<<<<< HEAD
    const { data: entryIds } = await db
=======
    const { data: entryIds } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
      .from("entries")
      .select("id")
      .eq("user_id", user.id)
      .gte("entry_date", startDate)
      .lte("entry_date", endDate);

    let attachmentsDeleted = 0;
    let driveFileIds: string[] = [];

    if (entryIds && entryIds.length > 0) {
<<<<<<< HEAD
      const ids = entryIds.map((e: { id: string }) => e.id);

      const { data: attachments } = await db
=======
      const ids = entryIds.map(e => e.id);

      const { data: attachments } = await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("attachments")
        .select("id, drive_file_id")
        .in("entry_id", ids);

      if (attachments) {
        driveFileIds = attachments
<<<<<<< HEAD
          .filter((a: { drive_file_id?: string | null }) => Boolean(a.drive_file_id))
          .map((a: { drive_file_id?: string | null }) => a.drive_file_id as string);

        await db
=======
          .filter(a => a.drive_file_id)
          .map(a => a.drive_file_id as string);

        await supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
          .from("attachments")
          .delete()
          .in("entry_id", ids);
        attachmentsDeleted = attachments.length;
      }
<<<<<<< HEAD

      const { error: entryTagDeleteError } = await db
        .from("entry_tags")
        .delete()
        .in("entry_id", ids);

      if (entryTagDeleteError) {
        console.error("Failed to delete entry tags:", entryTagDeleteError);
      }

      const { error: tradeDetailsDeleteError } = await db
        .from("trade_details")
        .delete()
        .in("entry_id", ids);

      if (tradeDetailsDeleteError) {
        console.error("Failed to delete trade details:", tradeDetailsDeleteError);
      }
=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    }

    const entriesCount = entryIds?.length || 0;
    
    const [entriesResult, goalsResult, snapshotsResult, yearsResult] = await Promise.all([
<<<<<<< HEAD
      db
=======
      supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("entries")
        .delete()
        .eq("user_id", user.id)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate),
<<<<<<< HEAD
      db
=======
      supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("goals")
        .delete()
        .eq("user_id", user.id)
        .eq("year", year),
<<<<<<< HEAD
      db
=======
      supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("portfolio_snapshots")
        .delete()
        .eq("user_id", user.id)
        .gte("snapshot_date", startDate)
        .lte("snapshot_date", endDate),
<<<<<<< HEAD
      db
=======
      supabase
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
        .from("financial_years")
        .delete()
        .eq("user_id", user.id)
        .eq("year", year)
    ]);

    if (entriesResult.error) {
      console.error("Failed to delete entries:", entriesResult.error);
      return NextResponse.json({ error: "Failed to delete entries: " + entriesResult.error.message }, { status: 500 });
    }
    if (goalsResult.error) {
      console.error("Failed to delete goals:", goalsResult.error);
    }
    if (snapshotsResult.error) {
      console.error("Failed to delete snapshots:", snapshotsResult.error);
    }
    if (yearsResult.error) {
      console.error("Failed to delete year record:", yearsResult.error);
    }

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

    return NextResponse.json({
      ok: true,
      deleted: {
        entries: entriesCount,
<<<<<<< HEAD
        goals: Array.isArray(goalsResult.data) ? goalsResult.data.length : 0,
        attachments: attachmentsDeleted,
        snapshots: Array.isArray(snapshotsResult.data) ? snapshotsResult.data.length : 0
=======
        goals: 0,
        attachments: attachmentsDeleted,
        snapshots: 0
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
      },
      storageErrors
    });
  } catch (error) {
    console.error("Year delete error:", error);
    return NextResponse.json({ error: "Failed to delete year" }, { status: 500 });
  }
}
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
