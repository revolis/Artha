"use client";

import * as React from "react";

import { PageHeader } from "@/components/page-header";
import { HeatmapGrid } from "@/components/heatmap-grid";
import { YearSwitcher } from "@/components/year-switcher";
import { ChartCard } from "@/components/chart-card";
import { YearDeleteDialog } from "@/components/year-delete-dialog";
import { fetchWithAuth } from "@/lib/supabase/browser";
import type { HeatmapDay } from "@/lib/supabase/queries";

export default function HeatmapPage() {
  const currentYear = new Date().getUTCFullYear();
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const [years, setYears] = React.useState<number[]>([currentYear]);
  const [heatmapDays, setHeatmapDays] = React.useState<HeatmapDay[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteYear, setDeleteYear] = React.useState<number | null>(null);
  const [deleteYearOpen, setDeleteYearOpen] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchWithAuth(`/api/dashboard?year=${selectedYear}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to load heatmap");
        }
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setHeatmapDays(payload.dashboard?.heatmapDays ?? []);
        setYears(payload.years ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load heatmap");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedYear]);

  const handleAddYear = React.useCallback(async () => {
    const value = window.prompt("Enter year", String(selectedYear + 1));
    if (!value) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    try {
      const response = await fetchWithAuth("/api/years", {
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Year Heatmap"
        description="GitHub-style view of daily net performance."
      />

      <YearSwitcher
        years={years}
        selectedYear={selectedYear}
        onSelect={setSelectedYear}
        onAddYear={handleAddYear}
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

      <ChartCard title={`Heatmap for ${selectedYear}`} subtitle="Daily net P/L">
        {loading ? (
          <p className="text-sm text-mutedForeground">Loading heatmap…</p>
        ) : (
          <HeatmapGrid year={selectedYear} data={heatmapDays} />
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
