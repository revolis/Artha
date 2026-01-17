import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { getAvailableYears, getDashboardYearData } from "@/lib/supabase/queries";
import { isAuthDisabled, dashboardYears, heatmapDays } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getUTCFullYear();

  if (isAuthDisabled()) {
    const selectedYear = Number.isFinite(year) ? year : new Date().getUTCFullYear();
    const mockData = dashboardYears.find(d => d.year === selectedYear) ?? dashboardYears[0];
    const years = dashboardYears.map(d => d.year);
    
    return NextResponse.json({
      years,
      dashboard: {
        year: selectedYear,
        targets: mockData.targets.map(t => ({
          id: t.id,
          title: t.title,
          subtitle: t.subtitle,
          progress: t.progress,
          currentValue: Math.round(t.progress * 50000),
          targetValue: 50000,
          timeframe: "year" as const,
          targetType: "income" as const,
          startDate: `${selectedYear}-01-01`,
          endDate: `${selectedYear}-12-31`,
        })),
        portfolio: {
          totalValue: mockData.portfolio.totalValue,
          changeValue: mockData.portfolio.changeValue,
          changePercent: mockData.portfolio.changePercent,
        },
        pnl: {
          net: mockData.pnl.net,
          profit: mockData.pnl.profit,
          loss: Math.abs(mockData.pnl.loss),
          fees: 0,
          taxes: 0,
        },
        averageMonthlyNet: mockData.pnl.net / 6,
        netSeries: mockData.netSeries,
        categoryContribution: mockData.categoryContribution,
        portfolioSeries: mockData.portfolioSeries,
        recentEntries: mockData.recentEntries,
        heatmapDays: selectedYear === 2026 ? heatmapDays : [],
        hasTaxOrFee: false,
      },
    });
  }

  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const years = await getAvailableYears(supabase, user.id);
    const selectedYear = Number.isFinite(year) ? year : new Date().getUTCFullYear();
    const dashboard = await getDashboardYearData(supabase, user.id, selectedYear);

    return NextResponse.json({ years, dashboard });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
