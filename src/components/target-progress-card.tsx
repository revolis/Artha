"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CurrencyDisplay } from "@/components/currency-display";

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
          <h3 className="text-lg font-medium">{title}</h3>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-mutedForeground">Progress</span>
            <span className={cn("font-medium", isCompleted && "text-positive")}>{percentage}%</span>
          </div>

          <div className="relative">
            {percentage >= 100 ? (
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-positive transition-all"
                  style={{ width: `${Math.min(100, (100 / percentage) * 100)}%` }}
                />
                <div
                  className="absolute top-0 h-full rounded-r-full bg-emerald-600 transition-all"
                  style={{ 
                    left: `${Math.min(100, (100 / percentage) * 100)}%`,
                    width: `${100 - Math.min(100, (100 / percentage) * 100)}%` 
                  }}
                />
                <div 
                  className="absolute top-[-2px] h-[12px] w-[2px] bg-foreground"
                  style={{ left: `${(100 / percentage) * 100}%` }}
                  title="100% Target"
                />
              </div>
            ) : (
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-positive transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
          </div>

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
