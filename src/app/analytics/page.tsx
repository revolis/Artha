"use client";

import * as React from "react";
import { format as formatDate } from "date-fns";
import { fetchWithAuth } from "@/lib/supabase/browser";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/hooks/use-currency";
import { CurrencyDisplay } from "@/components/currency-display";

export default function AnalyticsPage() {
  const { format } = useCurrency();
  const [period, setPeriod] = React.useState("30d");
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/analytics?period=${period}`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg text-sm">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center gap-2" style={{ color: entry.color }}>
              <span className="capitalize">{entry.name}:</span>
              <span className="font-mono font-medium">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(entry.value))}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !data) {
    return <AnalyticsSkeleton />;
  }

  if (!data) return <div className="p-8">Failed to load data.</div>;

  const { totals, chartData, categoryBreakdown, topEntries } = data;

  const getGrowth = (current: number, prev: number) => {
    if (!prev) return 0;
    return ((current - prev) / prev) * 100;
  };

  const incomeGrowth = getGrowth(totals.income, totals.prevIncome);
  const expenseGrowth = getGrowth(totals.expenses, totals.prevExpenses);

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-mutedForeground">
            Deep dive into your financial performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4 text-mutedForeground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Total Income"
          value={totals.income}
          growth={incomeGrowth}
          trend="up-good"
          icon={TrendingUp}
        />
        <KpiCard
          title="Total Expenses"
          value={totals.expenses}
          growth={expenseGrowth}
          trend="down-good"
          icon={TrendingDown}
        />
        <KpiCard
          title="Net Savings"
          value={totals.net}
          growth={0} // Net growth is tricky if negative
          trend={totals.net >= 0 ? "neutral" : "bad"}
          icon={DollarSign}
        />
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
          <CardDescription>
            {data.meta.grouping === 'day' ? "Daily" : "Monthly"} breakdown over current period
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => format(value)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Where you spent the most</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryBreakdown.map((item: any, i: number) => {
              const max = categoryBreakdown[0].value;
              const percent = (item.value / totals.expenses) * 100;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-mutedForeground">
                      {percent.toFixed(1)}% ({format(item.value)})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(item.value / max) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {categoryBreakdown.length === 0 && (
              <div className="text-center py-8 text-mutedForeground text-sm">No expense data</div>
            )}
          </CardContent>
        </Card>

        {/* Top Entries */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Highest Expenses</CardTitle>
            <CardDescription>Top individual transactions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-0">
            {topEntries.expenses.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between py-3 border-b last:border-0 border-border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none truncate max-w-[180px]">
                    {entry.notes || entry.categories?.name || "Uncategorized"}
                  </p>
                  <p className="text-xs text-mutedForeground">
                    {formatDate(new Date(entry.entry_date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="font-mono font-medium text-red-600">
                  <CurrencyDisplay value={-Number(entry.amount_usd_base)} className="text-red-600" />
                </div>
              </div>
            ))}
            {topEntries.expenses.length === 0 && (
              <div className="text-center py-8 text-mutedForeground text-sm">No expenses found</div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function KpiCard({ title, value, growth, trend, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-mutedForeground">{title}</p>
          <Icon className="h-4 w-4 text-mutedForeground" />
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <CurrencyDisplay value={value} className="text-2xl font-bold" />
          {growth !== 0 && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              growth > 0
                ? (trend === 'up-good' ? 'text-emerald-500' : 'text-red-500')
                : (trend === 'down-good' ? 'text-emerald-500' : 'text-red-500')
            )}>
              {growth > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {Math.abs(growth).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-[400px]" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  )
}
