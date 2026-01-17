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
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Receipt,
  Wallet,
  Target,
  Activity,
  PieChart as PieChartIcon,
  Layers,
  Award,
  AlertTriangle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/hooks/use-currency";
import { CurrencyDisplay } from "@/components/currency-display";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export default function AnalyticsPage() {
  const { format } = useCurrency();
  const [period, setPeriod] = React.useState("all");
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

  const { 
    totals, 
    chartData, 
    categoryBreakdown, 
    incomeBreakdown,
    sourceBreakdown,
    transactionStats,
    financialRatios,
    monthlyTrends,
    insights,
    topEntries,
    meta
  } = data;

  const getGrowth = (current: number, prev: number | null) => {
    if (prev === null || prev === undefined || !Number.isFinite(prev) || prev === 0) return null;
    const growth = ((current - prev) / prev) * 100;
    return Number.isFinite(growth) ? growth : null;
  };

  const incomeGrowth = getGrowth(totals?.income ?? 0, totals?.prevIncome);
  const expenseGrowth = getGrowth(totals?.expenses ?? 0, totals?.prevExpenses);
  const netGrowth = getGrowth(totals?.net ?? 0, totals?.prevNet);

  const getGroupingLabel = () => {
    switch (meta?.grouping) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'year': return 'Yearly';
      default: return '';
    }
  };

  const getDateRangeLabel = () => {
    if (!meta?.start || !meta?.end) return "";
    try {
      return `${formatDate(new Date(meta.start), "MMM d, yyyy")} - ${formatDate(new Date(meta.end), "MMM d, yyyy")}`;
    } catch {
      return "";
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of your financial performance
          </p>
          {meta?.entryCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {meta.entryCount} entries · {getDateRangeLabel()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Income"
          value={totals?.income ?? 0}
          growth={incomeGrowth}
          trend="up-good"
          icon={TrendingUp}
          color="text-emerald-500"
          formatFn={format}
        />
        <KpiCard
          title="Total Expenses"
          value={totals?.expenses ?? 0}
          growth={expenseGrowth}
          trend="down-good"
          icon={TrendingDown}
          color="text-red-500"
          formatFn={format}
        />
        <KpiCard
          title="Net Profit/Loss"
          value={totals?.net ?? 0}
          growth={netGrowth}
          trend={(totals?.net ?? 0) >= 0 ? "up-good" : "bad"}
          icon={DollarSign}
          color={(totals?.net ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}
          formatFn={format}
        />
        <KpiCard
          title="Savings Rate"
          value={financialRatios?.savingsRate ?? 0}
          isPercentage
          icon={PiggyBank}
          color={(financialRatios?.savingsRate ?? 0) >= 20 ? "text-emerald-500" : "text-amber-500"}
          formatFn={format}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Transactions"
          value={transactionStats?.totalTransactions ?? 0}
          subtitle={`${transactionStats?.incomeCount ?? 0} income, ${transactionStats?.expenseCount ?? 0} expense`}
          icon={Receipt}
          formatFn={format}
        />
        <StatCard
          title="Avg Income"
          value={transactionStats?.avgIncome ?? 0}
          isCurrency
          subtitle="per transaction"
          icon={Wallet}
          formatFn={format}
        />
        <StatCard
          title="Avg Expense"
          value={transactionStats?.avgExpense ?? 0}
          isCurrency
          subtitle="per transaction"
          icon={Activity}
          formatFn={format}
        />
        <StatCard
          title="Expense Ratio"
          value={financialRatios?.expenseRatio ?? 0}
          isPercentage
          subtitle="of total income"
          icon={Target}
          formatFn={format}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Income vs Expenses Over Time
          </CardTitle>
          <CardDescription>
            {getGroupingLabel()} breakdown with net profit trend
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => format(value)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Line type="monotone" dataKey="net" name="Net" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {insights?.bestMonth && insights?.worstMonth && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Award className="h-5 w-5" />
                Best Performing Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDate(new Date(insights.bestMonth.month + "-01"), "MMMM yyyy")}</div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="text-emerald-600">+{format(insights.bestMonth.income)} income</span>
                <span className="text-red-600">-{format(insights.bestMonth.expenses)} expenses</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  Net: {format(insights.bestMonth.net)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Lowest Performing Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDate(new Date(insights.worstMonth.month + "-01"), "MMMM yyyy")}</div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="text-emerald-600">+{format(insights.worstMonth.income)} income</span>
                <span className="text-red-600">-{format(insights.worstMonth.expenses)} expenses</span>
                <span className={cn(
                  "font-medium",
                  insights.worstMonth.net >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  Net: {format(insights.worstMonth.net)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-emerald-500" />
              Income Sources
            </CardTitle>
            <CardDescription>Breakdown of income by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(incomeBreakdown ?? []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No income data</div>
            ) : (
              (incomeBreakdown ?? []).map((item: any, i: number) => {
                const max = incomeBreakdown[0]?.value || 1;
                const totalIncome = totals?.income || 1;
                const percent = totalIncome > 0 ? (item.value / totalIncome) * 100 : 0;
                const barWidth = max > 0 ? (item.value / max) * 100 : 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">
                        {Number.isFinite(percent) ? percent.toFixed(1) : "0.0"}% ({format(item.value)})
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Number.isFinite(barWidth) ? barWidth : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-red-500" />
              Expense Categories
            </CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(categoryBreakdown ?? []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No expense data</div>
            ) : (
              (categoryBreakdown ?? []).map((item: any, i: number) => {
                const max = categoryBreakdown[0]?.value || 1;
                const totalExpenses = totals?.expenses || 1;
                const percent = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0;
                const barWidth = max > 0 ? (item.value / max) * 100 : 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">
                        {Number.isFinite(percent) ? percent.toFixed(1) : "0.0"}% ({format(item.value)})
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${Number.isFinite(barWidth) ? barWidth : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {(sourceBreakdown ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Platform/Source Performance
            </CardTitle>
            <CardDescription>Income and expenses by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Source</th>
                    <th className="text-right py-2 font-medium text-emerald-600">Income</th>
                    <th className="text-right py-2 font-medium text-red-600">Expenses</th>
                    <th className="text-right py-2 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {(sourceBreakdown ?? []).map((source: any) => (
                    <tr key={source.name} className="border-b last:border-0">
                      <td className="py-3 font-medium">{source.name}</td>
                      <td className="py-3 text-right text-emerald-600">{format(source.income)}</td>
                      <td className="py-3 text-right text-red-600">{format(source.expenses)}</td>
                      <td className={cn(
                        "py-3 text-right font-medium",
                        source.net >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {format(source.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
              Top Income Transactions
            </CardTitle>
            <CardDescription>Largest income entries</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-0">
            {(topEntries?.income ?? []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No income found</div>
            ) : (
              (topEntries?.income ?? []).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between py-3 border-b last:border-0 border-border">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none truncate max-w-[200px]">
                      {entry.notes || entry.categories?.name || "Uncategorized"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(entry.entry_date), "MMM d, yyyy")} · <span className="uppercase">{entry.entry_type}</span>
                    </p>
                  </div>
                  <div className="font-mono font-medium text-emerald-600">
                    <CurrencyDisplay value={Math.abs(Number(entry.amount_usd_base))} className="text-emerald-600" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Top Expense Transactions
            </CardTitle>
            <CardDescription>Largest expense entries</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-0">
            {(topEntries?.expenses ?? []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No expenses found</div>
            ) : (
              (topEntries?.expenses ?? []).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between py-3 border-b last:border-0 border-border">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none truncate max-w-[200px]">
                      {entry.notes || entry.categories?.name || "Uncategorized"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(entry.entry_date), "MMM d, yyyy")} · <span className="uppercase">{entry.entry_type}</span>
                    </p>
                  </div>
                  <div className="font-mono font-medium text-red-600">
                    <CurrencyDisplay value={-Math.abs(Number(entry.amount_usd_base))} className="text-red-600" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {(monthlyTrends ?? []).length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Monthly Trends
            </CardTitle>
            <CardDescription>Net profit/loss pattern over months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatDate(new Date(value + "-01"), "MMM yy")}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => format(value)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="net" name="Net" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({ title, value, growth, trend, icon: Icon, color, isPercentage, formatFn }: any) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const hasGrowth = growth !== null && growth !== undefined && Number.isFinite(growth) && growth !== 0;
  const safeGrowth = hasGrowth ? growth : 0;
  
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          {isPercentage ? (
            <span className="text-2xl font-bold">{safeValue.toFixed(1)}%</span>
          ) : (
            <CurrencyDisplay value={safeValue} className="text-2xl font-bold" />
          )}
          {hasGrowth && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              safeGrowth > 0
                ? (trend === 'up-good' ? 'text-emerald-500' : 'text-red-500')
                : (trend === 'down-good' ? 'text-emerald-500' : 'text-red-500')
            )}>
              {safeGrowth > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {Math.abs(safeGrowth).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, isCurrency, isPercentage, formatFn }: any) {
  const safeValue = Number.isFinite(value) ? value : 0;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-lg font-bold">
              {isCurrency && formatFn ? formatFn(safeValue) : isPercentage ? `${safeValue.toFixed(1)}%` : safeValue.toLocaleString()}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-[160px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-[400px]" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  );
}
