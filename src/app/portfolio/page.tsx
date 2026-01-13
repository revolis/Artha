"use client";

import * as React from "react";

import { PageHeader } from "@/components/page-header";
import { ChartCard } from "@/components/chart-card";
import { PortfolioAreaChart } from "@/components/charts/portfolio-area-chart";
import { YearSwitcher } from "@/components/year-switcher";
import { YearDeleteDialog } from "@/components/year-delete-dialog";

export default function PortfolioPage() {
  const currentYear = new Date().getUTCFullYear();
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const [years, setYears] = React.useState<number[]>([currentYear]);
  const [series, setSeries] = React.useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteYear, setDeleteYear] = React.useState<number | null>(null);
  const [deleteYearOpen, setDeleteYearOpen] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`/api/portfolio/snapshots?year=${selectedYear}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to load portfolio snapshots");
        }
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        const snapshots = payload.snapshots ?? [];
        const chartSeries = snapshots.map(
          (snapshot: { snapshot_date: string; total_value_usd: number }) => ({
            date: new Date(snapshot.snapshot_date).toLocaleDateString("en-US", { month: "short" }),
            value: Number(snapshot.total_value_usd)
          })
        );
        setSeries(chartSeries);
        setYears(payload.years ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load portfolio snapshots");
        setSeries([]);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedYear]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio"
        description="Auto snapshots are derived from your entry flow."
      />

      <YearSwitcher
        years={years}
        selectedYear={selectedYear}
        onSelect={setSelectedYear}
        onDeleteYear={(year) => {
          setDeleteYear(year);
          setDeleteYearOpen(true);
        }}
      />

      {error ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-sm text-negative">
          {error}
        </div>
      ) : null}

      <ChartCard title="Portfolio value" subtitle="Auto snapshots">
        {loading ? (
          <p className="text-sm text-mutedForeground">Loading portfolio...</p>
        ) : series.length === 0 ? (
          <p className="text-sm text-mutedForeground">No portfolio data yet.</p>
        ) : (
          <PortfolioAreaChart data={series} />
        )}
      </ChartCard>

      <YearDeleteDialog
        year={deleteYear}
        open={deleteYearOpen}
        onOpenChange={setDeleteYearOpen}
        onDeleted={(year) => {
          setYears((prev) => {
            const next = prev.filter((item) => item !== year);
            if (selectedYear === year) {
              const fallback = next[next.length - 1] ?? new Date().getUTCFullYear();
              setSelectedYear(fallback);
            }
            return next;
          });
        }}
      />
    </div>
  );
}
