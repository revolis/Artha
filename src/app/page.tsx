"use client";

import * as React from "react";
import Link from "next/link";

import { YearSwitcher } from "@/components/year-switcher";
import { YearDeleteDialog } from "@/components/year-delete-dialog";
import { TargetProgressCard } from "@/components/target-progress-card";
import { PortfolioHeroCard } from "@/components/portfolio-hero-card";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { NetPLChart } from "@/components/charts/net-pl-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { PortfolioAreaChart } from "@/components/charts/portfolio-area-chart";
import { MaskedValue } from "@/components/masked-value";
import { HeatmapGrid } from "@/components/heatmap-grid";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardYearData, NetSeriesKey } from "@/lib/supabase/queries";

const rangeOptions: { label: string; value: NetSeriesKey }[] = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "6 Months", value: "halfYear" },
  { label: "Yearly", value: "yearly" },
  { label: "All", value: "all" }
];

function createEmptyDashboard(year: number): DashboardYearData {
  return {
    year,
    targets: [],
    portfolio: { totalValue: 0, changeValue: 0, changePercent: 0 },
    pnl: { net: 0, profit: 0, loss: 0, fees: 0, taxes: 0 },
    averageMonthlyNet: 0,
    categoryContribution: [],
    netSeries: { monthly: [], quarterly: [], halfYear: [], yearly: [], all: [] },
    portfolioSeries: [],
    recentEntries: [],
    heatmapDays: [],
    hasTaxOrFee: false
  };
}

export default function DashboardPage() {
  const currentYear = new Date().getUTCFullYear();
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const [range, setRange] = React.useState<NetSeriesKey>("monthly");
  const [years, setYears] = React.useState<number[]>([currentYear]);
  const [dashboard, setDashboard] = React.useState<DashboardYearData>(() =>
    createEmptyDashboard(currentYear)
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteYear, setDeleteYear] = React.useState<number | null>(null);
  const [deleteYearOpen, setDeleteYearOpen] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`/api/dashboard?year=${selectedYear}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to load dashboard");
        }
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setDashboard(payload.dashboard);
        setYears(payload.years ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load dashboard");
        setDashboard(createEmptyDashboard(selectedYear));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedYear]);

  const rangeLabel =
    rangeOptions.find((item) => item.value === range)?.label ?? "Monthly";

  const targetLayoutClass =
    dashboard.targets.length === 1
      ? "flex items-center justify-center"
      : "grid gap-6 md:grid-cols-2 xl:grid-cols-3";
  const targetSize = dashboard.targets.length === 1 ? "lg" : "md";

  const contributionData = dashboard.categoryContribution.length
    ? dashboard.categoryContribution
    : [{ name: "No data", value: 0 }];

  const [firstCategory] = contributionData;
  const fallbackCategory = firstCategory ?? { name: "Uncategorized", value: 0 };
  const topCategory = contributionData.reduce(
    (prev, category) => (category.value > prev.value ? category : prev),
    fallbackCategory
  );
  const topPercent = Math.round(topCategory.value);

  const handleAddYear = React.useCallback(async () => {
    const value = window.prompt("Enter year", String(selectedYear + 1));
    if (!value) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    try {
      const response = await fetch("/api/years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: parsed })
      });
      if (!response.ok) {
        throw new Error("Failed to create year");
      }
      const payload = await response.json();
      setYears(payload.years ?? [parsed]);
      setSelectedYear(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create year");
    }
  }, [selectedYear]);

  const handleDeleteYearRequest = React.useCallback((year: number) => {
    setDeleteYear(year);
    setDeleteYearOpen(true);
  }, []);

  const handleYearDeleted = React.useCallback(
    (year: number) => {
      setYears((prev) => {
        const next = prev.filter((item) => item !== year);
        if (selectedYear === year) {
          const fallback = next[next.length - 1] ?? new Date().getUTCFullYear();
          setSelectedYear(fallback);
        }
        return next;
      });
    },
    [selectedYear]
  );

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-mutedForeground">
              Financial dashboard
            </p>
            <h1 className="text-3xl font-semibold">Financial Dashboard for Year {selectedYear}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/entries/new" className={cn(buttonVariants({ variant: "default" }))}>
              Add Entry
            </Link>
          </div>
        </div>
        <YearSwitcher
          years={years}
          selectedYear={selectedYear}
          onSelect={setSelectedYear}
          onAddYear={handleAddYear}
          onDeleteYear={handleDeleteYearRequest}
        />
      </div>

      {error ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-sm text-negative">
          {error}
        </div>
      ) : null}

      <section className={targetLayoutClass}>
        {dashboard.targets.length ? (
          dashboard.targets.map((target) => (
            <div key={target.id} className={cn(targetSize === "lg" && "w-full max-w-xl")}>
              <TargetProgressCard
                title={target.title}
                subtitle={target.subtitle}
                progress={target.progress}
                averageMonthlyNet={dashboard.averageMonthlyNet}
                size={targetSize}
              />
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-mutedForeground">
            {loading ? "Loading targets..." : "No targets yet. Add a goal to track progress."}
          </div>
        )}
      </section>

      <section>
        <PortfolioHeroCard
          totalValue={dashboard.portfolio.totalValue}
          changeValue={dashboard.portfolio.changeValue}
          changePercent={dashboard.portfolio.changePercent}
          series={dashboard.portfolioSeries}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Net P/L"
          displayValue={formatCurrency(dashboard.pnl.net, "USD")}
          tone={dashboard.pnl.net >= 0 ? "positive" : "negative"}
        />
        <KpiCard
          label="Profit"
          displayValue={formatCurrency(dashboard.pnl.profit, "USD")}
          tone="positive"
        />
        <KpiCard
          label="Loss"
          displayValue={formatCurrency(dashboard.pnl.loss, "USD")}
          tone="negative"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ChartCard title="Net P/L trend" subtitle={`Timeframe: ${rangeLabel}`}>
          <div className="space-y-4">
            <Tabs value={range} onValueChange={(value) => setRange(value as NetSeriesKey)}>
              <TabsList>
                {rangeOptions.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <NetPLChart data={dashboard.netSeries[range] ?? []} />
          </div>
        </ChartCard>
        <ChartCard
          title="Category contribution"
          subtitle={
            <span>
              {topCategory.name} · <MaskedValue value={`${topPercent}%`} /> of income for{" "}
              {selectedYear}
            </span>
          }
        >
          <CategoryDonut data={contributionData} />
          <p className="mt-4 text-sm text-mutedForeground">
            {topCategory.name} contributes <MaskedValue value={`${topPercent}%`} /> of income for{" "}
            {selectedYear}.
          </p>
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <ChartCard title="Portfolio value" subtitle="Auto snapshots">
          <PortfolioAreaChart data={dashboard.portfolioSeries} />
        </ChartCard>
        <ChartCard title="Recent entries" subtitle="Latest activity">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.recentEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell className="capitalize">{entry.type}</TableCell>
                  <TableCell>{entry.category}</TableCell>
                  <TableCell>
                    <MaskedValue value={formatCurrency(entry.amount, "USD")} />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/entries/${entry.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartCard>
      </section>

      <section>
        <ChartCard title="Year heatmap" subtitle={`Daily net P/L for ${selectedYear}`}>
          <HeatmapGrid year={selectedYear} data={dashboard.heatmapDays} />
        </ChartCard>
      </section>

      <YearDeleteDialog
        year={deleteYear}
        open={deleteYearOpen}
        onOpenChange={setDeleteYearOpen}
        onDeleted={handleYearDeleted}
      />
    </div>
  );
}
