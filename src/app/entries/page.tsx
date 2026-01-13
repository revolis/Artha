"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { MaskedValue } from "@/components/masked-value";
import { YearSwitcher } from "@/components/year-switcher";
import { YearDeleteDialog } from "@/components/year-delete-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn, formatCurrency } from "@/lib/utils";

type EntryListItem = {
  id: string;
  entry_date: string;
  entry_type: "profit" | "loss" | "fee" | "tax" | "transfer";
  amount_usd_base: number | string;
  notes: string | null;
  category: { name: string | null } | null;
  source: { platform: string | null } | null;
};

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function formatEntryAmount(entry: EntryListItem) {
  const amount = Math.abs(toNumber(entry.amount_usd_base));
  if (entry.entry_type === "profit") return amount;
  if (entry.entry_type === "transfer") return 0;
  return -amount;
}

export default function EntriesPage() {
  return (
    <Suspense fallback={<EntriesFallback />}>
      <EntriesContent />
    </Suspense>
  );
}

function EntriesFallback() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Entries"
        description="Track every profit, loss, fee, tax, and transfer in one ledger."
      />
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-mutedForeground">
        Loading entries...
      </div>
    </div>
  );
}

function EntriesContent() {
  const searchParams = useSearchParams();
  const currentYear = new Date().getUTCFullYear();
  const queryYear = Number(searchParams.get("year"));
  const [selectedYear, setSelectedYear] = React.useState(
    Number.isFinite(queryYear) ? queryYear : currentYear
  );
  const [years, setYears] = React.useState<number[]>([currentYear]);
  const [entries, setEntries] = React.useState<EntryListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = React.useState<EntryListItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteYear, setDeleteYear] = React.useState<number | null>(null);
  const [deleteYearOpen, setDeleteYearOpen] = React.useState(false);

  const loadEntries = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/entries?year=${selectedYear}`, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load entries");
      }
      const payload = await response.json();
      setEntries(payload.entries ?? []);
      setYears(payload.years?.length ? payload.years : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  React.useEffect(() => {
    let active = true;
    loadEntries().catch(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, [loadEntries]);

  React.useEffect(() => {
    if (!menuOpenId) return;
    const handleClick = () => setMenuOpenId(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuOpenId]);

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/entries/${entryToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to delete entry");
      }
      setEntryToDelete(null);
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setDeleting(false);
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
      <PageHeader
        title="Entries"
        description="Track every profit, loss, fee, tax, and transfer in one ledger."
        actions={
          <Link href="/entries/new" className={cn(buttonVariants({ variant: "default" }))}>
            Add Entry
          </Link>
        }
      />

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

      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        {loading ? (
          <p className="text-sm text-mutedForeground">Loading entries...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-mutedForeground">No entries for this year yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(parseISO(entry.entry_date), "yyyy-MM-dd")}</TableCell>
                  <TableCell className="capitalize">{entry.entry_type}</TableCell>
                  <TableCell>{entry.category?.name ?? "Uncategorized"}</TableCell>
                  <TableCell>{entry.source?.platform ?? "-"}</TableCell>
                  <TableCell className="text-mutedForeground">
                    {entry.notes?.slice(0, 40) || "-"}
                  </TableCell>
                  <TableCell>
                    <MaskedValue value={formatCurrency(formatEntryAmount(entry), "USD")} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="relative inline-flex"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setMenuOpenId((prev) => (prev === entry.id ? null : entry.id))
                        }
                        aria-label="Open entry actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {menuOpenId === entry.id ? (
                        <div className="absolute right-0 top-9 z-10 w-36 rounded-2xl border border-border bg-card p-2 shadow-soft">
                          <Link
                            href={`/entries/${entry.id}`}
                            className="block rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted"
                            onClick={() => setMenuOpenId(null)}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-negative hover:bg-muted"
                            onClick={() => {
                              setMenuOpenId(null);
                              setEntryToDelete(entry);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(entryToDelete)}
        onOpenChange={(open) => {
          if (!open) setEntryToDelete(null);
        }}
        title="Delete entry?"
        description="This permanently deletes the entry and any attachments linked to it."
        confirmLabel="Delete entry"
        onConfirm={handleDeleteEntry}
        loading={deleting}
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
