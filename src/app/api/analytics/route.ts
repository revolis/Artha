import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { getAnalyticsData, Period } from "@/lib/supabase/analytics-queries";

export async function GET(request: NextRequest) {
    const supabase = createSupabaseRouteClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") || "30d") as Period;
    const customStart = searchParams.get("start") || undefined;
    const customEnd = searchParams.get("end") || undefined;

    try {
        const data = await getAnalyticsData(
            supabase,
            user.user.id,
            period,
            customStart,
            customEnd
        );

        return NextResponse.json(data);
    } catch (err: any) {
        console.error("Analytics Error:", err);
        return NextResponse.json({ error: err.message || "Failed to fetch analytics" }, { status: 500 });
    }
}
