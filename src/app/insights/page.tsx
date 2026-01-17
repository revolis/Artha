"use client";

import * as React from "react";
import { format as formatDate } from "date-fns";
import {
  Sparkles,
  Brain,
  TrendingUp,
  PiggyBank,
  Target,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Calendar,
  RefreshCw,
  ChevronRight
} from "lucide-react";

import { fetchWithAuth } from "@/lib/supabase/browser";
import { PageHeader } from "@/components/page-header";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type InsightType = "comprehensive" | "spending" | "savings" | "goals" | "forecast";

const insightTypes = [
  {
    id: "comprehensive" as InsightType,
    name: "Financial Health Report",
    description: "Complete analysis of your financial situation",
    icon: Brain,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    id: "spending" as InsightType,
    name: "Spending Analysis",
    description: "Deep dive into where your money goes",
    icon: BarChart3,
    color: "text-red-500",
    bgColor: "bg-red-500/10"
  },
  {
    id: "savings" as InsightType,
    name: "Savings Opportunities",
    description: "Find ways to save more money",
    icon: PiggyBank,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  {
    id: "goals" as InsightType,
    name: "Goal Progress Review",
    description: "Check how you're tracking toward your goals",
    icon: Target,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  {
    id: "forecast" as InsightType,
    name: "Financial Forecast",
    description: "Predict future trends based on your data",
    icon: TrendingUp,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10"
  },
];

export default function InsightsPage() {
  const [period, setPeriod] = React.useState("this_month");
  const [customDateRange, setCustomDateRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [selectedType, setSelectedType] = React.useState<InsightType>("comprehensive");
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const body: any = { 
        period: period === "custom" ? "custom" : period,
        insightType: selectedType
      };
      
      if (period === "custom" && customDateRange.from && customDateRange.to) {
        body.customStart = formatDate(customDateRange.from, "yyyy-MM-dd");
        body.customEnd = formatDate(customDateRange.to, "yyyy-MM-dd");
      }

      const response = await fetchWithAuth("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to generate insights");
      }

      setAnalysis(payload.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "this_month": return "This Month";
      case "this_quarter": return "This Quarter";
      case "6m": return "Last 6 Months";
      case "ytd": return "This Year";
      case "all": return "All Time";
      case "custom": return customDateRange.from && customDateRange.to 
        ? `${formatDate(customDateRange.from, "MMM d")} - ${formatDate(customDateRange.to, "MMM d, yyyy")}`
        : "Custom Range";
      default: return period;
    }
  };

  const selectedInsight = insightTypes.find(t => t.id === selectedType);

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Insights"
        description="Get personalized financial analysis powered by Gemini AI."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Time Period
              </CardTitle>
              <CardDescription>Choose the date range for your analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={period === "this_month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("this_month")}
                >
                  This Month
                </Button>
                <Button
                  variant={period === "this_quarter" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("this_quarter")}
                >
                  This Quarter
                </Button>
                <Button
                  variant={period === "6m" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("6m")}
                >
                  6 Months
                </Button>
                <Button
                  variant={period === "ytd" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("ytd")}
                >
                  This Year
                </Button>
                <Button
                  variant={period === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("all")}
                >
                  All Time
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={period === "custom" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPeriod("custom")}
                    >
                      Custom Range
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={customDateRange.from}
                      selected={{ from: customDateRange.from, to: customDateRange.to }}
                      onSelect={(range) => {
                        setCustomDateRange({ from: range?.from, to: range?.to });
                        if (range?.from && range?.to) {
                          setPeriod("custom");
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {period === "custom" && customDateRange.from && customDateRange.to && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Selected: {formatDate(customDateRange.from, "MMM d, yyyy")} - {formatDate(customDateRange.to, "MMM d, yyyy")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Choose Analysis Type
              </CardTitle>
              <CardDescription>What would you like to analyze?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {insightTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
                      selectedType === type.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", type.bgColor)}>
                      <type.icon className={cn("h-4 w-4", type.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{type.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {type.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={loading || (period === "custom" && (!customDateRange.from || !customDateRange.to))}
            className="w-full gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing your finances...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate {selectedInsight?.name}
              </>
            )}
          </Button>

          {error && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="flex items-start gap-3 pt-6">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-600">Analysis Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedInsight && <selectedInsight.icon className={cn("h-5 w-5", selectedInsight.color)} />}
                  {selectedInsight?.name}
                </CardTitle>
                <CardDescription>
                  Analysis for {getPeriodLabel()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {analysis.split(/\n/).map((line, i) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return <div key={i} className="h-3" />;
                    
                    if (trimmedLine.startsWith('## ')) {
                      return (
                        <h2 key={i} className="text-lg font-bold mt-6 mb-3 text-foreground">
                          {trimmedLine.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (trimmedLine.startsWith('# ')) {
                      return (
                        <h1 key={i} className="text-xl font-bold mt-6 mb-3 text-foreground">
                          {trimmedLine.replace('# ', '')}
                        </h1>
                      );
                    }
                    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                      const content = trimmedLine.slice(2);
                      return (
                        <div key={i} className="flex items-start gap-2 my-1.5">
                          <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          <span className="text-sm">{renderBoldText(content)}</span>
                        </div>
                      );
                    }
                    
                    return (
                      <p key={i} className="text-sm leading-relaxed my-2">
                        {renderBoldText(trimmedLine)}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-blue-500/10">
                  <Brain className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Financial Health</p>
                  <p className="text-muted-foreground text-xs">Get a complete overview of your financial status</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-red-500/10">
                  <BarChart3 className="h-3.5 w-3.5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium">Spending Analysis</p>
                  <p className="text-muted-foreground text-xs">Identify spending patterns and anomalies</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-emerald-500/10">
                  <PiggyBank className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium">Savings Tips</p>
                  <p className="text-muted-foreground text-xs">Discover opportunities to save more</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-amber-500/10">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">Forecast</p>
                  <p className="text-muted-foreground text-xs">Predict future income and expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1. Select a time period for analysis</p>
              <p>2. Choose the type of insight you want</p>
              <p>3. Click Generate to get AI-powered analysis</p>
              <p className="pt-2 text-xs border-t">
                AI analyzes your real transaction data to provide personalized insights and recommendations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function renderBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
