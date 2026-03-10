import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
<<<<<<< HEAD
import { createFirebaseRouteClient, getAuthenticatedUser } from "@/lib/firebase/route";
import { getAnalyticsData, Period } from "@/lib/firebase/analytics-queries";

export async function GET(request: NextRequest) {
    const { client: db } = createFirebaseRouteClient();
=======
import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { getAnalyticsData, Period } from "@/lib/supabase/analytics-queries";

export async function GET(request: NextRequest) {
    const { client: supabase } = createSupabaseRouteClient();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") || "30d") as Period;
    const customStart = searchParams.get("start") || undefined;
    const customEnd = searchParams.get("end") || undefined;

    try {
        const data = await getAnalyticsData(
<<<<<<< HEAD
            db,
=======
            supabase,
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
            user.id,
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
<<<<<<< HEAD


=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
