import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { MaskedValue } from "@/components/masked-value";
import { cn, formatCurrency } from "@/lib/utils";

type TargetProgressCardProps = {
  title: string;
  subtitle?: string;
  progress: number;
  averageMonthlyNet?: number;
  size?: "md" | "lg";
};

export function TargetProgressCard({
  title,
  subtitle,
  progress,
  averageMonthlyNet,
  size = "md"
}: TargetProgressCardProps) {
  const percentage = Math.min(100, Math.max(0, Math.round(progress * 100)));
  const circleSize = size === "lg" ? "h-28 w-28" : "h-24 w-24";
  const innerSize = size === "lg" ? "h-20 w-20" : "h-16 w-16";

  return (
    <Card className={cn(size === "lg" && "p-2")}>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          {averageMonthlyNet !== undefined ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-mutedForeground">
              Avg monthly income
              <MaskedValue
                value={formatCurrency(averageMonthlyNet, "USD")}
                className="text-xs font-semibold text-positive"
              />
            </div>
          ) : null}
          <CardTitle className={cn(size === "lg" ? "text-xl" : "text-lg")}>{title}</CardTitle>
          {subtitle ? <p className="text-xs text-mutedForeground">{subtitle}</p> : null}
        </div>
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full",
            circleSize
          )}
          style={{
            backgroundImage: `conic-gradient(#2F6B5E ${percentage * 3.6}deg, #EEE7DF 0deg)`
          }}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-card",
              innerSize
            )}
          >
            <MaskedValue value={`${percentage}%`} className="text-sm font-semibold" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress>
          <ProgressIndicator style={{ width: `${percentage}%` }} />
        </Progress>
        <p className="text-xs text-mutedForeground">Progress to target</p>
      </CardContent>
    </Card>
  );
}
