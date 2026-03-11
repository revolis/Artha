"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { fetchWithAuth } from "@/lib/firebase/browser";
import { MaskedValue } from "@/components/masked-value";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type TradeDirection = "usdt_to_cash" | "cash_to_usdt";

type P2PTrade = {
  id: string;
  trade_date: string;
  direction: TradeDirection;
  usdt_amount: number;
  cash_amount: number;
  cash_currency: string;
  notes: string | null;
};

type TradeSummary = {
  sell: {
    usdt: number;
    cash: number;
    count: number;
    avg_rate: number;
  };
  buy: {
    usdt: number;
    cash: number;
    count: number;
    avg_rate: number;
  };
  net: {
    usdt: number;
    cash: number;
  };
};

type TradeFormState = {
  trade_date: string;
  direction: TradeDirection;
  usdt_amount: string;
  cash_amount: string;
  cash_currency: string;
  notes: string;
};

const EMPTY_SUMMARY: TradeSummary = {
  sell: { usdt: 0, cash: 0, count: 0, avg_rate: 0 },
  buy: { usdt: 0, cash: 0, count: 0, avg_rate: 0 },
  net: { usdt: 0, cash: 0 }
};

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDefaultFormState(): TradeFormState {
  return {
    trade_date: getTodayDate(),
    direction: "usdt_to_cash",
    usdt_amount: "",
    cash_amount: "",
    cash_currency: "NPR",
    notes: ""
  };
}

function mapTradeToForm(trade: P2PTrade): TradeFormState {
  return {
    trade_date: trade.trade_date,
    direction: trade.direction,
    usdt_amount: String(trade.usdt_amount),
    cash_amount: String(trade.cash_amount),
    cash_currency: trade.cash_currency || "NPR",
    notes: trade.notes ?? ""
  };
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function formatFixed(value: number, digits = 2) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function formatUsdt(value: number) {
  return `${formatFixed(value, 2)} USDT`;
}

function formatCash(value: number, currency: string) {
  const currencyCode = currency || "NPR";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${currencyCode} ${formatFixed(value, 2)}`;
  }
}

function formatDirection(direction: TradeDirection) {
  return direction === "usdt_to_cash" ? "USDT -> Cash" : "Cash -> USDT";
}

export default function P2PCashPage() {
  const currentYear = new Date().getUTCFullYear();
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const [years, setYears] = React.useState<number[]>([currentYear]);
  const [trades, setTrades] = React.useState<P2PTrade[]>([]);
  const [summary, setSummary] = React.useState<TradeSummary>(EMPTY_SUMMARY);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTrade, setEditingTrade] = React.useState<P2PTrade | null>(null);
  const [form, setForm] = React.useState<TradeFormState>(() => createDefaultFormState());
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [tradeToDelete, setTradeToDelete] = React.useState<P2PTrade | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const loadTrades = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/p2p-cash?year=${selectedYear}`, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load P2P trades");
      }

      const payload = await response.json();
      const nextTrades = (payload.trades ?? []).map((trade: any) => ({
        id: trade.id,
        trade_date: trade.trade_date,
        direction: trade.direction as TradeDirection,
        usdt_amount: toNumber(trade.usdt_amount),
        cash_amount: toNumber(trade.cash_amount),
        cash_currency: typeof trade.cash_currency === "string" && trade.cash_currency ? trade.cash_currency : "NPR",
        notes: trade.notes ?? null
      })) as P2PTrade[];

      const nextYears = (payload.years ?? [])
        .map((year: number | string) => Number(year))
        .filter((year: number) => Number.isFinite(year));

      setTrades(nextTrades);
      setSummary(payload.summary ?? EMPTY_SUMMARY);
      setYears(nextYears.length > 0 ? nextYears : [currentYear]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load P2P trades");
      setTrades([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, currentYear]);

  React.useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const openCreateDialog = React.useCallback(() => {
    setEditingTrade(null);
    setForm(createDefaultFormState());
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = React.useCallback((trade: P2PTrade) => {
    setEditingTrade(trade);
    setForm(mapTradeToForm(trade));
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = React.useCallback(() => {
    setDialogOpen(false);
    setEditingTrade(null);
    setForm(createDefaultFormState());
    setFormError(null);
  }, []);

  const handleSaveTrade = async () => {
    setFormError(null);

    if (!form.trade_date) {
      setFormError("Trade date is required.");
      return;
    }

    const usdtAmount = Number(form.usdt_amount);
    const cashAmount = Number(form.cash_amount);

    if (!Number.isFinite(usdtAmount) || usdtAmount <= 0) {
      setFormError("USDT amount must be greater than 0.");
      return;
    }

    if (!Number.isFinite(cashAmount) || cashAmount <= 0) {
      setFormError("Cash amount must be greater than 0.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        trade_date: form.trade_date,
        direction: form.direction,
        usdt_amount: usdtAmount,
        cash_amount: cashAmount,
        cash_currency: form.cash_currency.trim().toUpperCase() || "NPR",
        notes: form.notes.trim() || null
      };

      const endpoint = editingTrade ? `/api/p2p-cash/${editingTrade.id}` : "/api/p2p-cash";
      const method = editingTrade ? "PUT" : "POST";

      const response = await fetchWithAuth(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const responsePayload = await response.json().catch(() => ({}));
        throw new Error(responsePayload.error || "Failed to save P2P trade");
      }

      closeDialog();

      const tradeYear = Number(form.trade_date.slice(0, 4));
      if (Number.isFinite(tradeYear) && tradeYear !== selectedYear) {
        setSelectedYear(tradeYear);
      } else {
        await loadTrades();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save P2P trade";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrade = async () => {
    if (!tradeToDelete) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/p2p-cash/${tradeToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to delete P2P trade");
      }

      setTradeToDelete(null);
      await loadTrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete P2P trade");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">P2P Cash Trades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track manual USDT to Cash and Cash to USDT transactions with a live summary.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            className="h-10 rounded-2xl border border-border bg-card px-3 text-sm"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Add P2P Trade
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">USDT Sold to Cash</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <MaskedValue value={formatUsdt(summary.sell.usdt)} />
            </p>
            <p className="text-2xl font-semibold text-emerald-600">
              <MaskedValue value={formatCash(summary.sell.cash, "NPR")} />
            </p>
            <p className="text-xs text-muted-foreground">Trades: {summary.sell.count}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">USDT Bought by Cash</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <MaskedValue value={formatUsdt(summary.buy.usdt)} />
            </p>
            <p className="text-2xl font-semibold text-red-600">
              <MaskedValue value={formatCash(summary.buy.cash, "NPR")} />
            </p>
            <p className="text-xs text-muted-foreground">Trades: {summary.buy.count}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Net Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p
              className={cn(
                "text-2xl font-semibold",
                summary.net.usdt >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              <MaskedValue
                value={`${summary.net.usdt >= 0 ? "+" : ""}${formatUsdt(summary.net.usdt)}`}
              />
            </p>
            <p
              className={cn(
                "text-sm font-medium",
                summary.net.cash >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              <MaskedValue
                value={`${summary.net.cash >= 0 ? "+" : ""}${formatCash(summary.net.cash, "NPR")}`}
              />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Average Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Sell Avg: <MaskedValue value={`${formatFixed(summary.sell.avg_rate, 2)} NPR / USDT`} />
            </p>
            <p className="text-sm text-muted-foreground">
              Buy Avg: <MaskedValue value={`${formatFixed(summary.buy.avg_rate, 2)} NPR / USDT`} />
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>USDT</TableHead>
                <TableHead>Cash</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="pl-6 text-muted-foreground" colSpan={7}>
                    Loading trades...
                  </TableCell>
                </TableRow>
              ) : trades.length === 0 ? (
                <TableRow>
                  <TableCell className="pl-6 text-muted-foreground" colSpan={7}>
                    No P2P cash trades found for {selectedYear}.
                  </TableCell>
                </TableRow>
              ) : (
                trades.map((trade) => {
                  const rate = trade.usdt_amount > 0 ? trade.cash_amount / trade.usdt_amount : 0;

                  return (
                    <TableRow key={trade.id}>
                      <TableCell className="pl-6 font-medium">
                        {format(parseISO(trade.trade_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            trade.direction === "usdt_to_cash"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {formatDirection(trade.direction)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <MaskedValue value={formatUsdt(trade.usdt_amount)} />
                      </TableCell>
                      <TableCell>
                        <MaskedValue value={formatCash(trade.cash_amount, trade.cash_currency)} />
                      </TableCell>
                      <TableCell>
                        <MaskedValue value={`${formatFixed(rate, 2)} ${trade.cash_currency} / USDT`} />
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">
                        {trade.notes || "-"}
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(trade)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-600"
                            onClick={() => setTradeToDelete(trade)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
            return;
          }
          setDialogOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTrade ? "Edit P2P trade" : "Add P2P trade"}</DialogTitle>
            <DialogDescription>
              Record cash and USDT movement manually for your P2P deals.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trade_date">Trade date</Label>
                <Input
                  id="trade_date"
                  type="date"
                  value={form.trade_date}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      trade_date: event.target.value
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade_direction">Direction</Label>
                <Select
                  value={form.direction}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      direction: value as TradeDirection
                    }))
                  }
                >
                  <SelectTrigger id="trade_direction">
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usdt_to_cash">USDT -&gt; Cash (Sell USDT)</SelectItem>
                    <SelectItem value="cash_to_usdt">Cash -&gt; USDT (Buy USDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usdt_amount">USDT amount</Label>
                <Input
                  id="usdt_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.usdt_amount}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      usdt_amount: event.target.value
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cash_amount">Cash amount</Label>
                <Input
                  id="cash_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cash_amount}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      cash_amount: event.target.value
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cash_currency">Cash currency</Label>
              <Input
                id="cash_currency"
                value={form.cash_currency}
                maxLength={12}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    cash_currency: event.target.value.toUpperCase()
                  }))
                }
                placeholder="NPR"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade_notes">Notes (optional)</Label>
              <Textarea
                id="trade_notes"
                value={form.notes}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    notes: event.target.value
                  }))
                }
                rows={3}
                placeholder="Counterparty, location, or reference notes"
              />
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          </div>

          <DialogFooter>
            <Button onClick={handleSaveTrade} disabled={saving}>
              {saving ? "Saving..." : editingTrade ? "Update trade" : "Create trade"}
            </Button>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(tradeToDelete)}
        onOpenChange={(open) => {
          if (!open) setTradeToDelete(null);
        }}
        title="Delete trade?"
        description={
          tradeToDelete
            ? `Delete ${formatDirection(tradeToDelete.direction)} record from ${tradeToDelete.trade_date}?`
            : undefined
        }
        confirmLabel="Delete trade"
        onConfirm={handleDeleteTrade}
        loading={deleting}
        destructive
      />
    </div>
  );
}
