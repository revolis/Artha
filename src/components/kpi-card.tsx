import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MaskedValue } from "@/components/masked-value";

const trendStyles = {
  positive: "success",
  negative: "danger",
  neutral: "default"
} as const;

const valueTone = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-foreground"
} as const;

type KpiCardProps = {
  label: string;
  displayValue: string;
  trend?: string;
  tone?: keyof typeof trendStyles;
};

export function KpiCard({ label, displayValue, trend, tone = "neutral" }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-mutedForeground">{label}</p>
        {trend ? <Badge variant={trendStyles[tone]}>{trend}</Badge> : null}
      </CardHeader>
      <CardContent>
        <MaskedValue
          value={displayValue}
          className={`text-2xl font-semibold ${valueTone[tone]}`}
        />
      </CardContent>
    </Card>
  );
}
