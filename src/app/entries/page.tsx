"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format, parseISO, startOfYear, endOfYear, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { 
  Plus, 
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash2,
  Edit3
} from "lucide-react";

import { fetchWithAuth } from "@/lib/supabase/browser";
import { MaskedValue } from "@/components/masked-value";
import { YearSwitcher } from "@/components/year-switcher";
import { YearDeleteDialog } from "@/components/year-delete-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type EntryListItem = {
  id: string;
  entry_date: string;
  entry_type: "profit" | "loss" | "fee" | "tax" | "transfer";
  amount_usd_base: number | string;
  notes: string | null;
  category: { name: string | null } | null;
  source: { platform: string | null } | null;
};

type TimeframeOption = "this_month" | "last_month" | "this_quarter" | "this_year" | "all" | "custom";

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function formatEntryAmount(entry: EntryListItem) {
  const amount = Math.abs(toNumber(entry.amount_usd_base));
  if (entry.entry_type === "profit") return amount;
  if (entry.entry_type === "transfer") return 0;
  return -amount;
}

function EntryRow({ 
  entry, 
  onDelete,
  expanded,
  onToggleExpand
}: { 
  entry: EntryListItem; 
  onDelete: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const amount = formatEntryAmount(entry);
  const isPositive = amount >= 0;
  const hasLongNote = entry.notes && entry.notes.length > 80;

  React.useEffect(() => {
    if (!menuOpen) return;
    const handleClick = () => setMenuOpen(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuOpen]);

  return (
    <div className="group border-b border-border/50 last:border-0">
      <div className="flex items-center py-4 px-2 hover:bg-muted/30 transition-colors">
        <div className="w-28 shrink-0 text-sm text-muted-foreground">
          {format(parseISO(entry.entry_date), "MMM dd, yyyy")}
        </div>
        
        <div className="w-20 shrink-0">
          <span className={cn(
            "text-sm font-medium capitalize",
            entry.entry_type === "profit" && "text-emerald-600",
            ["loss", "fee", "tax"].includes(entry.entry_type) && "text-red-600",
            entry.entry_type === "transfer" && "text-muted-foreground"
          )}>
            {entry.entry_type}
          </span>
        </div>

        <div className="w-32 shrink-0 text-sm text-foreground">
          {entry.category?.name || <span className="text-muted-foreground">—</span>}
        </div>

        <div className="w-32 shrink-0 text-sm text-foreground">
          {entry.source?.platform || <span className="text-muted-foreground">—</span>}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          {entry.notes ? (
            <div className="flex items-start gap-1">
              <p className={cn(
                "text-sm text-muted-foreground",
                !expanded && "truncate"
              )}>
                {expanded ? entry.notes : entry.notes.slice(0, 80)}
                {!expanded && hasLongNote && "..."}
              </p>
              {hasLongNote && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                  className="shrink-0 text-primary hover:underline"
                >
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>

        <div className={cn(
          "w-28 shrink-0 text-right font-semibold tabular-nums",
          isPositive ? "text-emerald-600" : "text-red-600"
        )}>
          <MaskedValue value={`${isPositive ? "+" : ""}${formatCurrency(amount, "USD")}`} />
        </div>

        <div className="w-12 shrink-0 flex justify-end relative" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-32 rounded-xl border border-border bg-card p-1.5 shadow-lg">
              <Link
                href={`/entries/${entry.id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      {expanded && entry.notes && (
        <div className="px-2 pb-4 pl-32">
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
            {entry.notes}
          </p>
        </div>
      )}
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
      <div className="rounded-2xl border border-border bg-card">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="flex-1 h-4 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
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
  const [timeframe, setTimeframe] = React.useState<TimeframeOption>("all");
  const [customStart, setCustomStart] = React.useState<Date | undefined>();
  const [customEnd, setCustomEnd] = React.useState<Date | undefined>();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

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

  const getTimeframeDates = React.useCallback(() => {
    const now = new Date();
    switch (timeframe) {
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "this_quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        return { start: quarterStart, end: quarterEnd };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "custom":
        return { start: customStart, end: customEnd };
      default:
        return { start: undefined, end: undefined };
    }
  }, [timeframe, customStart, customEnd]);

  const filteredEntries = React.useMemo(() => {
    const { start, end } = getTimeframeDates();
    
    return entries.filter((entry) => {
      const entryDate = parseISO(entry.entry_date);
      
      if (start && entryDate < start) return false;
      if (end && entryDate > end) return false;
      
      const matchesSearch = !searchQuery || 
        entry.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.source?.platform?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === "all" || entry.entry_type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [entries, searchQuery, filterType, getTimeframeDates]);

  const timeframeLabels: Record<TimeframeOption, string> = {
    this_month: "This Month",
    last_month: "Last Month",
    this_quarter: "This Quarter",
    this_year: "This Year",
    all: "All Time",
    custom: "Custom Range"
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entries</h1>
          <p className="text-muted-foreground mt-1">
            Track every profit, loss, fee, tax, and transfer.
          </p>
        </div>
        <Link href="/entries/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <YearSwitcher
          years={years}
          selectedYear={selectedYear}
          onSelect={setSelectedYear}
          onDeleteYear={handleDeleteYearRequest}
        />
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Types</option>
            <option value="profit">Profit</option>
            <option value="loss">Loss</option>
            <option value="fee">Fee</option>
            <option value="tax">Tax</option>
            <option value="transfer">Transfer</option>
          </select>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as TimeframeOption)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {Object.entries(timeframeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {timeframe === "custom" && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {customStart ? format(customStart, "MMM dd") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customStart}
                    onSelect={setCustomStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {customEnd ? format(customEnd, "MMM dd") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customEnd}
                    onSelect={setCustomEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-2 py-3">
          <div className="flex items-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="w-28 shrink-0 pl-2">Date</div>
            <div className="w-20 shrink-0">Type</div>
            <div className="w-32 shrink-0">Category</div>
            <div className="w-32 shrink-0">Source</div>
            <div className="flex-1">Notes</div>
            <div className="w-28 shrink-0 text-right">Amount</div>
            <div className="w-12 shrink-0"></div>
          </div>
        </div>

        <div className="divide-y divide-border/30">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="flex-1 h-4 rounded bg-muted" />
                  <div className="h-4 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery || filterType !== "all" || timeframe !== "all"
                  ? "No entries match your filters"
                  : "No entries yet"}
              </p>
              {!searchQuery && filterType === "all" && (
                <Link href="/entries/new">
                  <Button variant="outline" className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Add your first entry
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onDelete={() => setEntryToDelete(entry)}
                expanded={expandedId === entry.id}
                onToggleExpand={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              />
            ))
          )}
        </div>
        
        {!loading && filteredEntries.length > 0 && (
          <div className="border-t border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Showing {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
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
