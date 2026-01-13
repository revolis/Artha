import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        console.log("=== AUTH DEBUG TEST ===");
        console.log("ENV Check:");
        console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING");
        console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING");

        const supabase = createSupabaseRouteClient();
        console.log("Supabase client created");

        const { data, error } = await supabase.auth.getUser();
        console.log("getUser() result:", { hasData: !!data, hasUser: !!data?.user, error: error?.message });

        if (error) {
            console.error("Auth error:", error);
            return NextResponse.json({
                success: false,
                error: error.message,
                details: "getUser() failed"
            }, { status: 401 });
        }

        if (!data.user) {
            console.log("No user found in session");
            return NextResponse.json({
                success: false,
                error: "No user",
                details: "data.user is null"
            }, { status: 401 });
        }

        console.log("User authenticated:", data.user.id);
        return NextResponse.json({
            success: true,
            userId: data.user.id,
            email: data.user.email
        });

    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error"
        }, { status: 500 });
    }
}
