import { NextResponse } from "next/server";
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { supabaseServer } from "@/lib/supabase/server";
import { getDriveAccessToken } from "@/lib/drive/oauth";

// GET /api/drive/[fileId] - Get file metadata/view link
export async function GET(
    request: Request,
    { params }: { params: { fileId: string } }
) {
    const fileId = params.fileId;
    const { client: supabase } = createSupabaseRouteClient();
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get refresh token
    const { data: tokenRow } = await supabaseServer
        .from("drive_tokens")
        .select("refresh_token")
        .eq("user_id", user.id)
        .single();

    if (!tokenRow?.refresh_token) {
        return NextResponse.json({ error: "Drive not connected" }, { status: 400 });
    }

    try {
        const accessToken = await getDriveAccessToken(tokenRow.refresh_token);

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,webContentLink,thumbnailLink`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: "File not found" }, { status: 404 });
            }
            return NextResponse.json({ error: "Failed to fetch file from Drive" }, { status: response.status });
        }

        const fileData = await response.json();
        return NextResponse.json(fileData);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/drive/[fileId] - Delete file from Drive and Attachments table
export async function DELETE(
    request: Request,
    { params }: { params: { fileId: string } }
) {
    const fileId = params.fileId;
    const { client: supabase } = createSupabaseRouteClient();
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get refresh token
    const { data: tokenRow } = await supabaseServer
        .from("drive_tokens")
        .select("refresh_token")
        .eq("user_id", user.id)
        .single();

    if (!tokenRow?.refresh_token) {
        return NextResponse.json({ error: "Drive not connected" }, { status: 400 });
    }

    try {
        const accessToken = await getDriveAccessToken(tokenRow.refresh_token);

        // 1. Delete from Google Drive
        const driveResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        if (!driveResponse.ok && driveResponse.status !== 404) {
            // If 404, it's already gone, so we can proceed to delete record
            return NextResponse.json({ error: "Failed to delete from Drive" }, { status: driveResponse.status });
        }

        // 2. Delete from Supabase attachments
        const { error: dbError } = await supabase
            .from("attachments")
            .delete()
            .eq("drive_file_id", fileId);

        if (dbError) {
            return NextResponse.json({ error: "Failed to delete attachment record" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
