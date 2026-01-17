"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { 
  MoreHorizontal, 
  Trash2, 
  Edit3, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Tag,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Filter
} from "lucide-react";

import { fetchWithAuth } from "@/lib/supabase/browser";
import { MaskedValue } from "@/components/masked-value";
import { YearSwitcher } from "@/components/year-switcher";
import { YearDeleteDialog } from "@/components/year-delete-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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

function getEntryTypeConfig(type: string) {
  switch (type) {
    case "profit":
      return { 
        label: "Profit", 
        color: "text-emerald-600 dark:text-emerald-400", 
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800",
        icon: TrendingUp
      };
    case "loss":
      return { 
        label: "Loss", 
        color: "text-red-600 dark:text-red-400", 
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        icon: TrendingDown
      };
    case "fee":
      return { 
        label: "Fee", 
        color: "text-amber-600 dark:text-amber-400", 
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        icon: TrendingDown
      };
    case "tax":
      return { 
        label: "Tax", 
        color: "text-purple-600 dark:text-purple-400", 
        bg: "bg-purple-50 dark:bg-purple-950/30",
        border: "border-purple-200 dark:border-purple-800",
        icon: TrendingDown
      };
    default:
      return { 
        label: "Transfer", 
        color: "text-slate-600 dark:text-slate-400", 
        bg: "bg-slate-50 dark:bg-slate-950/30",
        border: "border-slate-200 dark:border-slate-800",
        icon: TrendingUp
      };
  }
}

function EntryCard({ 
  entry, 
  onEdit, 
  onDelete 
}: { 
  entry: EntryListItem; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const config = getEntryTypeConfig(entry.entry_type);
  const Icon = config.icon;
  const amount = formatEntryAmount(entry);
  const isPositive = amount >= 0;
  const hasLongNote = entry.notes && entry.notes.length > 100;

  return (
    <div className={cn(
      "group relative rounded-2xl border-2 bg-white dark:bg-card p-5 transition-all duration-200",
      "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
      config.border
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            config.bg
          )}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                config.bg, config.color
              )}>
                {config.label}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(parseISO(entry.entry_date), "MMM dd, yyyy")}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              {entry.category?.name && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {entry.category.name}
                </span>
              )}
              {entry.source?.platform && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {entry.source.platform}
                </span>
              )}
            </div>

            {entry.notes && (
              <div className="pt-1">
                <div className={cn(
                  "text-sm text-foreground/80 leading-relaxed",
                  !expanded && hasLongNote && "line-clamp-2"
                )}>
                  <FileText className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />
                  {entry.notes}
                </div>
                {hasLongNote && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-1 text-xs text-primary hover:underline flex items-center gap-0.5"
                  >
                    {expanded ? (
                      <>Show less <ChevronUp className="h-3 w-3" /></>
                    ) : (
                      <>Show more <ChevronDown className="h-3 w-3" /></>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={cn(
            "text-xl font-bold tracking-tight",
            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            <MaskedValue 
              value={`${isPositive ? "+" : ""}${formatCurrency(amount, "USD")}`} 
            />
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onEdit}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entries</h1>
          <p className="text-muted-foreground mt-1">Loading your financial records...</p>
        </div>
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border-2 border-border bg-card p-5 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted" />
              </div>
              <div className="h-6 w-20 rounded bg-muted" />
            </div>
          </div>
        ))}
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
  const [entryToDelete, setEntryToDelete] = React.useState<EntryListItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteYear, setDeleteYear] = React.useState<number | null>(null);
  const [deleteYearOpen, setDeleteYearOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");

  const loadEntries = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`/api/entries?year=${selectedYear}`, { cache: "no-store" });
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

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`/api/entries/${entryToDelete.id}`, { method: "DELETE" });
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

  const filteredEntries = React.useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch = !searchQuery || 
        entry.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.source?.platform?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === "all" || entry.entry_type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [entries, searchQuery, filterType]);

  const stats = React.useMemo(() => {
    const totalProfit = entries
      .filter(e => e.entry_type === "profit")
      .reduce((sum, e) => sum + Math.abs(toNumber(e.amount_usd_base)), 0);
    const totalLoss = entries
      .filter(e => ["loss", "fee", "tax"].includes(e.entry_type))
      .reduce((sum, e) => sum + Math.abs(toNumber(e.amount_usd_base)), 0);
    return { totalProfit, totalLoss, net: totalProfit - totalLoss };
  }, [entries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entries</h1>
          <p className="text-muted-foreground mt-1">
            Track every profit, loss, fee, tax, and transfer in one ledger.
          </p>
        </div>
        <Link href="/entries/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
          <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Profit</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            <MaskedValue value={formatCurrency(stats.totalProfit, "USD")} />
          </div>
        </div>
        <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
          <div className="text-sm font-medium text-red-600 dark:text-red-400">Total Loss</div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
            <MaskedValue value={formatCurrency(stats.totalLoss, "USD")} />
          </div>
        </div>
        <div className={cn(
          "rounded-2xl border-2 p-4",
          stats.net >= 0 
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30" 
            : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
        )}>
          <div className={cn(
            "text-sm font-medium",
            stats.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>Net {selectedYear}</div>
          <div className={cn(
            "text-2xl font-bold mt-1",
            stats.net >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
          )}>
            <MaskedValue value={`${stats.net >= 0 ? "+" : ""}${formatCurrency(stats.net, "USD")}`} />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <YearSwitcher
          years={years}
          selectedYear={selectedYear}
          onSelect={setSelectedYear}
          onDeleteYear={handleDeleteYearRequest}
        />
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Types</option>
            <option value="profit">Profit</option>
            <option value="loss">Loss</option>
            <option value="fee">Fee</option>
            <option value="tax">Tax</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border-2 border-border bg-card p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-48 rounded bg-muted" />
                  </div>
                  <div className="h-6 w-20 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No entries found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery || filterType !== "all" 
                ? "Try adjusting your search or filter" 
                : "Start by adding your first entry"}
            </p>
            {!searchQuery && filterType === "all" && (
              <Link href="/entries/new">
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Entry
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={() => window.location.href = `/entries/${entry.id}`}
                onDelete={() => setEntryToDelete(entry)}
              />
            ))}
          </div>
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
