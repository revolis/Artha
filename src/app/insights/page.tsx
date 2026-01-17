"use client";

import * as React from "react";
import { format as formatDate } from "date-fns";
import {
  TrendingUp,
  Target,
  AlertCircle,
  BarChart3,
  Calendar,
  Loader2,
  Clock,
  ChevronRight,
  RefreshCw,
  FileText,
  Wallet,
  LineChart
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type InsightType = "comprehensive" | "spending" | "savings" | "goals" | "forecast";

const insightTypes = [
  {
    id: "comprehensive" as InsightType,
    name: "Health Report",
    description: "Complete financial overview",
    icon: FileText,
  },
  {
    id: "spending" as InsightType,
    name: "Spending",
    description: "Where your money goes",
    icon: BarChart3,
  },
  {
    id: "savings" as InsightType,
    name: "Savings",
    description: "Ways to save more",
    icon: Wallet,
  },
  {
    id: "goals" as InsightType,
    name: "Goals",
    description: "Track your progress",
    icon: Target,
  },
  {
    id: "forecast" as InsightType,
    name: "Forecast",
    description: "Predict future trends",
    icon: LineChart,
  },
];

const periodOptions = [
  { id: "this_month", label: "This Month" },
  { id: "this_quarter", label: "Quarter" },
  { id: "6m", label: "6 Months" },
  { id: "ytd", label: "Year" },
  { id: "all", label: "All Time" },
];

interface CachedInsight {
  type: InsightType;
  period: string;
  analysis: string;
  generatedAt: Date;
}

export default function InsightsPage() {
  const [period, setPeriod] = React.useState("this_month");
  const [customDateRange, setCustomDateRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [selectedType, setSelectedType] = React.useState<InsightType>("comprehensive");
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<{ message: string; isQuota: boolean; retryIn?: number } | null>(null);
  const [generatedAt, setGeneratedAt] = React.useState<Date | null>(null);
  const [cachedInsights, setCachedInsights] = React.useState<CachedInsight[]>([]);

  const getCacheKey = (type: InsightType, periodKey: string) => `${type}-${periodKey}`;
  
  const getCachedInsight = (type: InsightType, periodKey: string) => {
    return cachedInsights.find(c => getCacheKey(c.type, c.period) === getCacheKey(type, periodKey));
  };

  const handleGenerate = async () => {
    const periodKey = period === "custom" 
      ? `custom-${customDateRange.from?.toISOString()}-${customDateRange.to?.toISOString()}`
      : period;

    const cached = getCachedInsight(selectedType, periodKey);
    if (cached) {
      const cacheAge = Date.now() - cached.generatedAt.getTime();
      if (cacheAge < 30 * 60 * 1000) {
        setAnalysis(cached.analysis);
        setGeneratedAt(cached.generatedAt);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const body: Record<string, string> = { 
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
        const errorDetails = payload.details || payload.error || "Failed to generate insights";
        const isQuotaError = errorDetails.includes("429") || 
                           errorDetails.includes("quota") || 
                           errorDetails.includes("Too Many Requests") ||
                           errorDetails.includes("rate");
        
        let retryIn: number | undefined;
        const retryMatch = errorDetails.match(/retry in (\d+\.?\d*)/i);
        if (retryMatch) {
          retryIn = Math.ceil(parseFloat(retryMatch[1]));
        }

        throw { message: errorDetails, isQuota: isQuotaError, retryIn };
      }

      const now = new Date();
      setAnalysis(payload.analysis);
      setGeneratedAt(now);
      
      setCachedInsights(prev => {
        const filtered = prev.filter(c => getCacheKey(c.type, c.period) !== getCacheKey(selectedType, periodKey));
        return [...filtered, { type: selectedType, period: periodKey, analysis: payload.analysis, generatedAt: now }];
      });
    } catch (err: any) {
      if (err.isQuota !== undefined) {
        setError(err);
      } else {
        setError({ 
          message: err instanceof Error ? err.message : "Something went wrong.", 
          isQuota: false 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedInsight = insightTypes.find(t => t.id === selectedType);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description="Get personalized financial analysis powered by AI"
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Analysis Type</CardTitle>
          <CardDescription>Select the type of financial analysis you need</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
            {insightTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                    isSelected
                      ? "border-accent bg-accent/5"
                      : "border-border/60 bg-white hover:border-accent/40 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-lg",
                    isSelected ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "font-medium text-sm",
                      isSelected ? "text-accent" : "text-foreground"
                    )}>
                      {type.name}
                    </p>
                    <p className="text-xs mt-0.5 text-muted-foreground hidden sm:block">
                      {type.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Time Period</CardTitle>
          <CardDescription>Choose the date range for analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((opt) => (
              <Button
                key={opt.id}
                variant={period === opt.id ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(opt.id)}
                className={cn(
                  "h-9",
                  period === opt.id && "bg-accent hover:bg-accent/90"
                )}
              >
                {opt.label}
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={period === "custom" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 gap-1.5",
                    period === "custom" && "bg-accent hover:bg-accent/90"
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {period === "custom" && customDateRange.from && customDateRange.to
                    ? `${formatDate(customDateRange.from, "MMM d")} - ${formatDate(customDateRange.to, "MMM d")}`
                    : "Custom"}
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
        </CardContent>
      </Card>

      <Button
        onClick={handleGenerate}
        disabled={loading || (period === "custom" && (!customDateRange.from || !customDateRange.to))}
        className="w-full h-11 gap-2 bg-accent hover:bg-accent/90"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            Generate {selectedInsight?.name} Analysis
          </>
        )}
      </Button>

      {error && (
        <Card className={cn(
          "border",
          error.isQuota ? "border-warning/50 bg-warning/5" : "border-negative/50 bg-negative/5"
        )}>
          <CardContent className="flex items-start gap-4 pt-6">
            <div className={cn(
              "p-2 rounded-lg flex-shrink-0",
              error.isQuota ? "bg-warning/20" : "bg-negative/20"
            )}>
              {error.isQuota ? (
                <Clock className="h-4 w-4 text-warning" />
              ) : (
                <AlertCircle className="h-4 w-4 text-negative" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium text-sm",
                error.isQuota ? "text-warning" : "text-negative"
              )}>
                {error.isQuota ? "API Rate Limit Reached" : "Analysis Failed"}
              </p>
              {error.isQuota ? (
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>The API has reached its request limit.</p>
                  <p>Wait {error.retryIn ? `${error.retryIn} seconds` : "a minute"} and try again, or try a different analysis type.</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1 break-words">
                  {error.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card>
          <CardHeader className="border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedInsight && (
                  <div className="p-2 rounded-lg bg-accent text-white">
                    <selectedInsight.icon className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-base">{selectedInsight?.name} Analysis</CardTitle>
                  <CardDescription>
                    {generatedAt && `Generated ${formatDate(generatedAt, "MMM d, yyyy 'at' h:mm a")}`}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose prose-sm max-w-none">
              {analysis.split(/\n/).map((line, i) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return <div key={i} className="h-2" />;
                
                if (trimmedLine.startsWith('## ')) {
                  return (
                    <h2 key={i} className="text-base font-semibold mt-6 mb-3 text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                      {trimmedLine.replace('## ', '')}
                    </h2>
                  );
                }
                if (trimmedLine.startsWith('# ')) {
                  return (
                    <h1 key={i} className="text-lg font-semibold mt-6 mb-3 text-foreground">
                      {trimmedLine.replace('# ', '')}
                    </h1>
                  );
                }
                if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                  const content = trimmedLine.slice(2);
                  return (
                    <div key={i} className="flex items-start gap-2 my-1.5 ml-1">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                      <span className="text-sm leading-relaxed text-foreground">{renderBoldText(content)}</span>
                    </div>
                  );
                }
                
                return (
                  <p key={i} className="text-sm leading-relaxed my-2 text-muted-foreground">
                    {renderBoldText(trimmedLine)}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!analysis && !loading && !error && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-base mb-2">Ready to Analyze</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Select an analysis type and time period above, then click Generate to get 
              AI-powered insights about your finances.
            </p>
          </CardContent>
        </Card>
      )}
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
