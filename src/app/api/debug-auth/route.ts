import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        console.log("=== AUTH DEBUG TEST ===");
        console.log("ENV Check:");
        console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING");
        console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING");

        const { client: supabase } = createSupabaseRouteClient();
        console.log("Supabase client created");

        const user = await getAuthenticatedUser();
        console.log("getAuthenticatedUser() result:", { hasUser: !!user });

        if (!user) {
            console.log("No user found in session");
            return NextResponse.json({
                success: false,
                error: "No user",
                details: "user is null"
            }, { status: 401 });
        }

        console.log("User authenticated:", user.id);
        return NextResponse.json({
            success: true,
            userId: user.id,
            email: user.email
        });

    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error"
        }, { status: 500 });
    }
}
