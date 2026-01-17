"use client";

import * as React from "react";
import { format as formatDate } from "date-fns";
import {
  Sparkles,
  Brain,
  TrendingUp,
  PiggyBank,
  Target,
  AlertCircle,
  BarChart3,
  Calendar,
  Loader2,
  Clock,
  Zap,
  ChevronRight,
  RefreshCw
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
    icon: Brain,
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    id: "spending" as InsightType,
    name: "Spending",
    description: "Where your money goes",
    icon: BarChart3,
    gradient: "from-rose-500 to-pink-600"
  },
  {
    id: "savings" as InsightType,
    name: "Savings",
    description: "Ways to save more",
    icon: PiggyBank,
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    id: "goals" as InsightType,
    name: "Goals",
    description: "Track your progress",
    icon: Target,
    gradient: "from-violet-500 to-purple-600"
  },
  {
    id: "forecast" as InsightType,
    name: "Forecast",
    description: "Predict future trends",
    icon: TrendingUp,
    gradient: "from-amber-500 to-orange-600"
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
        description="Get personalized financial analysis powered by Gemini AI"
      />

      <div className="grid gap-3 grid-cols-5">
        {insightTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                isSelected
                  ? "border-transparent bg-gradient-to-br shadow-lg scale-[1.02]"
                  : "border-border bg-card hover:border-primary/30 hover:shadow-md"
              )}
              style={isSelected ? { backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` } : undefined}
            >
              <div className={cn(
                "p-3 rounded-xl",
                isSelected ? "bg-white/20" : `bg-gradient-to-br ${type.gradient} bg-opacity-10`
              )}>
                <Icon className={cn("h-5 w-5", isSelected ? "text-white" : "text-white")} />
              </div>
              <div className="text-center">
                <p className={cn(
                  "font-medium text-sm",
                  isSelected ? "text-white" : "text-foreground"
                )}>
                  {type.name}
                </p>
                <p className={cn(
                  "text-xs mt-0.5 hidden sm:block",
                  isSelected ? "text-white/80" : "text-muted-foreground"
                )}>
                  {type.description}
                </p>
              </div>
              {isSelected && (
                <div className={cn("absolute inset-0 rounded-xl bg-gradient-to-br -z-10", type.gradient)} />
              )}
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Time Period:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {periodOptions.map((opt) => (
                <Button
                  key={opt.id}
                  variant={period === opt.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod(opt.id)}
                  className="h-8"
                >
                  {opt.label}
                </Button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={period === "custom" ? "default" : "outline"}
                    size="sm"
                    className="h-8"
                  >
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
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleGenerate}
        disabled={loading || (period === "custom" && (!customDateRange.from || !customDateRange.to))}
        className={cn(
          "w-full h-12 gap-2 text-base font-medium transition-all",
          selectedInsight && `bg-gradient-to-r ${selectedInsight.gradient} hover:opacity-90`
        )}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5" />
            Generate {selectedInsight?.name} Analysis
          </>
        )}
      </Button>

      {error && (
        <Card className={cn(
          "border-2",
          error.isQuota ? "border-amber-500/50 bg-amber-500/5" : "border-red-500/50 bg-red-500/5"
        )}>
          <CardContent className="flex items-start gap-4 pt-6">
            <div className={cn(
              "p-2 rounded-full flex-shrink-0",
              error.isQuota ? "bg-amber-500/20" : "bg-red-500/20"
            )}>
              {error.isQuota ? (
                <Clock className="h-5 w-5 text-amber-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-semibold",
                error.isQuota ? "text-amber-700" : "text-red-700"
              )}>
                {error.isQuota ? "API Rate Limit Reached" : "Analysis Failed"}
              </p>
              {error.isQuota ? (
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <p>The free Gemini API has reached its request limit.</p>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">What you can do:</span>
                    <span>1. Wait {error.retryIn ? `~${error.retryIn} seconds` : "a minute"} and try again</span>
                    <span>2. Try a different analysis type (cached results load instantly)</span>
                    <span>3. Upgrade to a paid Gemini API plan for unlimited requests</span>
                  </div>
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
        <Card className="overflow-hidden">
          <CardHeader className={cn("bg-gradient-to-r text-white", selectedInsight?.gradient)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedInsight && <selectedInsight.icon className="h-6 w-6" />}
                <div>
                  <CardTitle className="text-white">{selectedInsight?.name} Analysis</CardTitle>
                  <CardDescription className="text-white/80">
                    {generatedAt && `Generated ${formatDate(generatedAt, "MMM d, yyyy 'at' h:mm a")}`}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
                className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {analysis.split(/\n/).map((line, i) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return <div key={i} className="h-2" />;
                
                if (trimmedLine.startsWith('## ')) {
                  return (
                    <h2 key={i} className="text-lg font-bold mt-6 mb-3 text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
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
                    <div key={i} className="flex items-start gap-2 my-1.5 ml-1">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{renderBoldText(content)}</span>
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
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Ready to Analyze</h3>
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
