"use client";

import * as React from "react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { MaskedValue } from "@/components/masked-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { YearSwitcher } from "@/components/year-switcher";
import { YearDeleteDialog } from "@/components/year-delete-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatCurrency } from "@/lib/utils";

const timeframeOptions = [
  { value: "year", label: "Year" },
  { value: "quarter", label: "Quarter" },
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" }
];

const targetTypeOptions = [
  { value: "income", label: "Income" },
  { value: "net", label: "Net" },
  { value: "portfolio_growth", label: "Portfolio growth" }
];

type GoalItem = {
  id: string;
  title: string;
  subtitle?: string;
  progress: number;
  targetValue: number;
  timeframe: string;
  targetType: string;
  startDate: string;
  endDate: string;
  categoryId?: string | null;
  categoryName?: string | null;
};

type CategoryOption = { id: string; name: string; type: string };

export default function GoalsPage() {
  const currentYear = new Date().getUTCFullYear();
  const [years, setYears] = React.useState<number[]>([currentYear]);
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const [goals, setGoals] = React.useState<GoalItem[]>([]);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [timeframe, setTimeframe] = React.useState("year");
  const [targetType, setTargetType] = React.useState("income");
  const [targetValue, setTargetValue] = React.useState("");
  const [startDate, setStartDate] = React.useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = React.useState(`${currentYear}-12-31`);
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [goalToDelete, setGoalToDelete] = React.useState<GoalItem | null>(null);
  const [deletingGoal, setDeletingGoal] = React.useState(false);
  const [deleteYear, setDeleteYear] = React.useState<number | null>(null);
  const [deleteYearOpen, setDeleteYearOpen] = React.useState(false);

  const loadGoals = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const [goalsResponse, yearsResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/goals?year=${selectedYear}`, { cache: "no-store", signal }),
          fetch("/api/years", { cache: "no-store", signal }),
          fetch("/api/categories", { cache: "no-store", signal })
        ]);

        if (!goalsResponse.ok) throw new Error("Failed to load goals");
        if (!yearsResponse.ok) throw new Error("Failed to load years");
        if (!categoriesResponse.ok) throw new Error("Failed to load categories");

        const goalsPayload = await goalsResponse.json();
        const yearsPayload = await yearsResponse.json();
        const categoriesPayload = await categoriesResponse.json();

        if (signal?.aborted) return;
        setGoals(goalsPayload.goals ?? []);
        setYears(yearsPayload.years ?? []);
        setCategories(categoriesPayload.categories ?? []);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load goals");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [selectedYear]
  );

  React.useEffect(() => {
    const controller = new AbortController();
    loadGoals(controller.signal);
    return () => controller.abort();
  }, [loadGoals]);

  React.useEffect(() => {
    setStartDate(`${selectedYear}-01-01`);
    setEndDate(`${selectedYear}-12-31`);
  }, [selectedYear]);

  const handleCreate = async () => {
    setSaving(true);
    setError(null);

    try {
      if (!targetValue || Number(targetValue) <= 0) {
        setError("Enter a target value.");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeframe,
          target_type: targetType,
          target_value_usd: Number(targetValue),
          start_date: startDate,
          end_date: endDate,
          category_id: categoryId || null
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to create goal");
      }

      setTargetValue("");
      setCategoryId(null);
      loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!goalToDelete) return;
    setDeletingGoal(true);
    setError(null);

    try {
      const response = await fetch(`/api/goals/${goalToDelete.id}`, { method: "DELETE" });
      if (response.ok) {
        setGoalToDelete(null);
        loadGoals();
        return;
      }
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Failed to delete goal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete goal");
    } finally {
      setDeletingGoal(false);
    }
  };

  const handleDeleteYearRequest = (year: number) => {
    setDeleteYear(year);
    setDeleteYearOpen(true);
  };

  const handleYearDeleted = (year: number) => {
    setYears((prev) => {
      const next = prev.filter((item) => item !== year);
      if (selectedYear === year) {
        const fallback = next[next.length - 1] ?? new Date().getUTCFullYear();
        setSelectedYear(fallback);
      }
      return next;
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Goals" description="Track progress across your financial targets." />

      <YearSwitcher
        years={years}
        selectedYear={selectedYear}
        onSelect={setSelectedYear}
        onDeleteYear={handleDeleteYearRequest}
      />

      {error ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-sm text-negative">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {loading ? (
            <p className="text-sm text-mutedForeground">Loading goals...</p>
          ) : goals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-6 text-sm text-mutedForeground">
              No goals yet. Create one to track your progress.
            </div>
          ) : (
            goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>{goal.title}</CardTitle>
                    <p className="text-sm text-mutedForeground">{goal.subtitle}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setGoalToDelete(goal)}>
                    Delete
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-mutedForeground">Target</span>
                    <MaskedValue
                      value={formatCurrency(goal.targetValue, "USD")}
                      className="text-sm font-semibold"
                    />
                  </div>
                  <Progress>
                    <ProgressIndicator style={{ width: `${Math.round(goal.progress * 100)}%` }} />
                  </Progress>
                  <p className="text-xs text-mutedForeground">
                    <MaskedValue value={`${Math.round(goal.progress * 100)}%`} /> of target achieved
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger id="timeframe">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-type">Target type</Label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger id="target-type">
                  <SelectValue placeholder="Select target type" />
                </SelectTrigger>
                <SelectContent>
                  {targetTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-value">Target value (USD)</Label>
              <Input
                id="target-value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={targetValue}
                onChange={(event) => setTargetValue(event.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Select
                value={categoryId ?? "all"}
                onValueChange={(value) => setCategoryId(value === "all" ? null : value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleCreate} disabled={saving}>
              {saving ? "Saving..." : "Create Goal"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(goalToDelete)}
        onOpenChange={(open) => {
          if (!open) setGoalToDelete(null);
        }}
        title="Delete goal?"
        description={goalToDelete ? `Remove ${goalToDelete.title}.` : undefined}
        confirmLabel="Delete goal"
        onConfirm={handleDelete}
        loading={deletingGoal}
        destructive
      />

      <YearDeleteDialog
        year={deleteYear}
        open={deleteYearOpen}
        onOpenChange={setDeleteYearOpen}
        onDeleted={handleYearDeleted}
      />
    </div>
  );
}
