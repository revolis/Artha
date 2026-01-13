"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CurrencyDisplay } from "@/components/currency-display";
import { Progress } from "@/components/ui/progress";

type TargetProgressCardProps = {
  title: string;
  subtitle?: string;
  progress: number;
  current: number;
  target: number;
  averageMonthlyNet: number;
  size?: "md" | "lg";
};

export function TargetProgressCard({
  title,
  subtitle,
  progress,
  current,
  target,
  averageMonthlyNet,
  size = "md"
}: TargetProgressCardProps) {
  const percentage = Math.round(progress * 100);
  const isCompleted = progress >= 1;
  const remaining = Math.max(0, target - current);
  const monthsToGoal =
    averageMonthlyNet > 0 ? Math.ceil(remaining / averageMonthlyNet) : Infinity;

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-mutedForeground">{subtitle}</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-medium">{title}</h3>
            {isCompleted ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-mutedForeground">
                Avg monthly income
                <CurrencyDisplay
                  value={averageMonthlyNet}
                  className="text-xs font-semibold text-positive"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-mutedForeground">Progress</span>
            <span className="font-medium">{percentage}%</span>
          </div>

          <Progress value={Math.min(100, percentage)} className="h-2" />

          <div className="flex justify-between text-xs text-mutedForeground">
            <div className="flex gap-1">
              <span>Current:</span>
              <CurrencyDisplay value={current} className="font-medium text-foreground" />
            </div>
            <div className="flex gap-1">
              <span>Target:</span>
              <CurrencyDisplay value={target} className="font-medium text-foreground" />
            </div>
          </div>

          {!isCompleted && averageMonthlyNet > 0 && monthsToGoal !== Infinity && (
            <p className="text-xs text-mutedForeground">
              Est. completion: <span className="font-medium text-foreground">{monthsToGoal} month{monthsToGoal > 1 ? 's' : ''}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
