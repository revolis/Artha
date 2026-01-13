"use client";

import * as React from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type YearDeleteDialogProps = {
  year: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (year: number) => void;
};

type DeleteSummary = {
  entries: number;
  goals: number;
  attachments: number;
  snapshots: number;
};

export function YearDeleteDialog({ year, open, onOpenChange, onDeleted }: YearDeleteDialogProps) {
  const [summary, setSummary] = React.useState<DeleteSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = React.useState(false);
  const [confirmValue, setConfirmValue] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !year) return;
    let active = true;
    setLoadingSummary(true);
    setError(null);

    fetch(`/api/years/${year}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to load delete summary");
        }
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setSummary({
          entries: payload.entries ?? 0,
          goals: payload.goals ?? 0,
          attachments: payload.attachments ?? 0,
          snapshots: payload.snapshots ?? 0
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load delete summary");
      })
      .finally(() => {
        if (!active) return;
        setLoadingSummary(false);
      });

    return () => {
      active = false;
    };
  }, [open, year]);

  const handleConfirm = async () => {
    if (!year) return;
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/years/${year}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete year");
      }

      onDeleted(year);

      if (payload.storageErrors?.length) {
        setError(
          `Deleted data, but failed to remove ${payload.storageErrors.length} Drive file(s).`
        );
        return;
      }

      onOpenChange(false);
      setConfirmValue("");
      setSummary(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete year");
    } finally {
      setDeleting(false);
    }
  };

  const typedMatch = year ? confirmValue.trim() === String(year) : false;
  const description = (
    <div className="space-y-3 text-sm text-mutedForeground">
      <p>
        This permanently deletes all data under year {year}. This action cannot be undone.
      </p>
      <div className="rounded-2xl border border-border bg-muted/50 px-3 py-2 text-xs">
        {loadingSummary ? (
          <p>Loading counts...</p>
        ) : summary ? (
          <div className="space-y-1">
            <p>Entries: {summary.entries}</p>
            <p>Goals: {summary.goals}</p>
            <p>Attachments: {summary.attachments}</p>
            <p>Snapshots: {summary.snapshots}</p>
          </div>
        ) : (
          <p>Counts unavailable.</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-year">Type {year} to confirm</Label>
        <Input
          id="confirm-year"
          value={confirmValue}
          onChange={(event) => setConfirmValue(event.target.value)}
          placeholder={`Enter ${year}`}
        />
      </div>
      {error ? <p className="text-xs text-negative">{error}</p> : null}
    </div>
  );

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setConfirmValue("");
          setSummary(null);
          setError(null);
        }
      }}
      title={`Delete year ${year}?`}
      description={description}
      confirmLabel="Delete year"
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      loading={deleting}
      destructive
      confirmDisabled={!typedMatch || loadingSummary}
    />
  );
}
