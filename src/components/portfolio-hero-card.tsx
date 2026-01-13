import { Card, CardContent } from "@/components/ui/card";
import { MaskedValue } from "@/components/masked-value";
import { PortfolioSparkline } from "@/components/charts/portfolio-sparkline";
import { cn, formatCurrency } from "@/lib/utils";

type PortfolioHeroCardProps = {
  totalValue: number;
  changeValue: number;
  changePercent: number;
  series: { date: string; value: number }[];
};

export function PortfolioHeroCard({
  totalValue,
  changeValue,
  changePercent,
  series
}: PortfolioHeroCardProps) {
  const changeTone = changeValue >= 0 ? "text-positive" : "text-negative";

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-6 p-6 md:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-mutedForeground">
            Total portfolio value
          </p>
          <MaskedValue
            value={formatCurrency(totalValue, "USD")}
            className="text-4xl font-semibold"
          />
          <div className="flex items-center gap-3 text-sm text-mutedForeground">
            <MaskedValue
              value={`${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`}
              className={cn("font-semibold", changeTone)}
            />
            <MaskedValue
              value={formatCurrency(changeValue, "USD")}
              className={cn("font-medium", changeTone)}
            />
            <span>since last period</span>
          </div>
        </div>
        <div className="flex flex-col items-end justify-between rounded-2xl bg-muted/60 p-4">
          <PortfolioSparkline data={series} />
          <p className="text-xs text-mutedForeground">Auto-updated snapshots</p>
        </div>
      </CardContent>
    </Card>
  );
}
