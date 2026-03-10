"use client";

import * as React from "react";
import { Download, Receipt, Calculator, Building2 } from "lucide-react";
import { format } from "date-fns";
import { fetchWithAuth } from "@/lib/supabase/browser";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function TaxFeesPage() {
  const [year, setYear] = React.useState<string>("all");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = year === 'all' ? '' : `?year=${year}`;
      const res = await fetchWithAuth(`/api/tax-fees${query}`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = (format: 'csv' | 'json') => {
    const query = year === 'all' ? `?format=${format}` : `?year=${year}&format=${format}`;
    window.open(`/api/tax-fees/export${query}`, '_blank');
  };

  if (loading && !data) {
    return <div className="p-8 text-center text-mutedForeground">Loading tax data...</div>;
  }

  if (!data) return <div className="p-8">Failed to load data.</div>;

  const { totals, categoryBreakdown, exchangeBreakdown, entries } = data;

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Tax & Fees</h1>
          <p className="text-mutedForeground">
            Track your tax obligations and platform fees.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              {/* Dynamic years could be better */}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-mutedForeground">Total Paid</CardTitle>
            <Calculator className="h-4 w-4 text-mutedForeground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.combined.toLocaleString()}</div>
            <p className="text-xs text-mutedForeground mt-1">Combined Taxes & Fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-mutedForeground">Taxes</CardTitle>
            <Building2 className="h-4 w-4 text-mutedForeground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${totals.tax.toLocaleString()}</div>
            <p className="text-xs text-mutedForeground mt-1">
              {((totals.tax / (totals.combined || 1)) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-mutedForeground">Fees</CardTitle>
            <Receipt className="h-4 w-4 text-mutedForeground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totals.fees.toLocaleString()}</div>
            <p className="text-xs text-mutedForeground mt-1">
              {((totals.fees / (totals.combined || 1)) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Breakdown by Category */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Breakdown by Category</h3>
          <div className="border rounded-xl bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryBreakdown.map((cat: any) => (
                  <TableRow key={cat.name}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-right text-mutedForeground">${cat.tax.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-mutedForeground">${cat.fee.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">${cat.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {categoryBreakdown.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-mutedForeground py-8">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Breakdown by Exchange */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Exchange Fees</h3>
          <div className="border rounded-xl bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Total Fees</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchangeBreakdown.map((ex: any) => (
                  <TableRow key={ex.name}>
                    <TableCell className="font-medium">{ex.name}</TableCell>
                    <TableCell className="text-right text-mutedForeground">{ex.count}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">${ex.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {exchangeBreakdown.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-mutedForeground py-8">
                      No exchange data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Recent Entries List - Optional but helpful */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold">Recent Entries</h3>
        <div className="border rounded-xl bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(entries || []).slice(0, 10).map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.entry_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="default" className={entry.entry_type === 'tax' ? "text-orange-600" : "text-red-600"}>
                      {entry.entry_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-mutedForeground">{entry.categories?.name}</TableCell>
                  <TableCell className="text-mutedForeground max-w-[200px] truncate">{entry.notes}</TableCell>
                  <TableCell className="text-right font-mono">${Number(entry.amount_usd_base).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
