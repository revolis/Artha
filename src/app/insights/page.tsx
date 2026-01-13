"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InsightsPage() {
  const [period, setPeriod] = React.useState("30d");
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Insights"
        description="Get personalized financial analysis powered by Gemini."
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-3xl border border-negative/20 bg-negative/5 p-6 text-sm text-negative">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        {analysis ? (
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            {/* Simple formatting for Markdown-like output since we don't have a markdown renderer installed */}
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
              {analysis.split(/\n/).map((line, i) => {
                // Simple bold handling for **text**
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                  <div key={i} className={`min-h-[1.5em] ${line.startsWith('#') ? 'font-bold text-lg mt-4 mb-2' : ''}`}>
                    {parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          !loading && !error && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-border py-12 text-center text-mutedForeground">
              <Sparkles className="mb-4 h-12 w-12 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">Ready to Analyze</h3>
              <p className="max-w-md">Select a time period and click analyze to let Gemini review your finances and provide actionable tips.</p>
            </div>
          )
        )}

        {loading && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-border bg-card/50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-mutedForeground">Crunching the numbers...</p>
          </div>
        )}
      </div>
    </div>
  );
}
