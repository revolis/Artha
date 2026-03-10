import { format } from "date-fns";

import { cn, formatCurrency } from "@/lib/utils";
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { MaskedValue } from "@/components/masked-value";
import type { HeatmapDay } from "@/lib/supabase/queries";

type HeatmapGridProps = {
  year: number;
  data: HeatmapDay[];
};

const positiveScale = [
  "bg-muted/40",
  "bg-emerald-200",
  "bg-emerald-300",
  "bg-emerald-400",
  "bg-emerald-500"
];

const negativeScale = [
  "bg-muted/40",
  "bg-red-200",
  "bg-red-300",
  "bg-red-400",
  "bg-red-500"
];

function getPercentile(values: number[], percentile: number) {
  if (values.length === 0) return 0;
  const index = Math.max(0, Math.ceil(values.length * percentile) - 1);
  return values[index];
}

export function HeatmapGrid({ year, data }: HeatmapGridProps) {
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const endOfYear = new Date(Date.UTC(year, 11, 31));
  const gridStart = new Date(startOfYear);
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());
  const gridEnd = new Date(endOfYear);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay()));

  const dataMap = new Map(data.map((day) => [day.date, day]));
  const values = data
    .map((day) => Math.abs(day.net))
    .filter((value) => value > 0)
    .sort((a, b) => a - b);

  const thresholds = [
    getPercentile(values, 0.25),
    getPercentile(values, 0.5),
    getPercentile(values, 0.75),
    getPercentile(values, 1)
  ];

  const weeks: {
    date: Date;
    key: string;
    inYear: boolean;
    stats: HeatmapDay;
  }[][] = [];

  let current = new Date(gridStart);
  while (current <= gridEnd) {
    const week: {
      date: Date;
      key: string;
      inYear: boolean;
      stats: HeatmapDay;
    }[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const key = current.toISOString().slice(0, 10);
      const inYear = current >= startOfYear && current <= endOfYear;
      const stats =
        dataMap.get(key) ??
        ({
          date: key,
          net: 0,
          profit: 0,
          loss: 0,
          topCategory: null,
          topSource: null
        } as HeatmapDay);

      week.push({
        date: new Date(current),
        key,
        inYear,
        stats
      });

      current = new Date(current);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    weeks.push(week);
  }

  const monthLabels = weeks.map((week) => {
    const monthStart = week.find((day) => day.inYear && day.date.getUTCDate() === 1);
    return monthStart ? format(monthStart.date, "MMM") : "";
  });

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <TooltipProvider>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex items-start gap-3">
          <div className="grid grid-rows-7 gap-[2px] pt-[18px] text-[10px] text-mutedForeground">
            {dayLabels.map((label, index) => (
              <span key={`day-label-${index}`} className="h-[10px] leading-[10px]">
                {label}
              </span>
            ))}
          </div>
          <div>
            <div className="mb-2 grid grid-flow-col auto-cols-[12px] gap-[2px] text-[10px] text-mutedForeground">
              {monthLabels.map((label, index) => (
                <span key={`month-${index}`} className="h-[12px] leading-[12px]">
                  {label}
                </span>
              ))}
            </div>
            <div className="grid grid-flow-col auto-cols-[12px] grid-rows-7 gap-[2px]">
              {weeks.map((week, weekIndex) =>
                week.map((day) => {
                  const magnitude = Math.abs(day.stats.net);
                  let intensity = 0;
                  if (magnitude > 0) {
                    if (magnitude <= thresholds[0]) intensity = 1;
                    else if (magnitude <= thresholds[1]) intensity = 2;
                    else if (magnitude <= thresholds[2]) intensity = 3;
                    else intensity = 4;
                  }

                  const palette = day.stats.net >= 0 ? positiveScale : negativeScale;
                  const colorClass = day.inYear
                    ? palette[intensity]
                    : "bg-transparent";

                  return (
                    <TooltipRoot key={`${weekIndex}-${day.key}`}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "h-[10px] w-[10px] rounded-[2px] border transition",
                            day.inYear ? "border-border/60" : "border-transparent",
                            colorClass,
                            day.inYear && "hover:ring-1 hover:ring-foreground/30"
                          )}
                          aria-label={`${day.key} net ${day.stats.net}`}
                        />
                      </TooltipTrigger>
                      {day.inYear ? (
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="text-[11px] text-mutedForeground">
                              {format(day.date, "MMM d, yyyy")}
                            </p>
                            <MaskedValue
                              value={formatCurrency(day.stats.net, "USD")}
                              className={cn(
                                "text-sm font-semibold",
                                day.stats.net < 0 ? "text-negative" : "text-positive"
                              )}
                            />
                            <div className="text-[11px] text-mutedForeground">
                              <div>
                                Profit:{" "}
                                <MaskedValue value={formatCurrency(day.stats.profit, "USD")} />
                              </div>
                              <div>
                                Loss:{" "}
                                <MaskedValue value={formatCurrency(day.stats.loss, "USD")} />
                              </div>
                              <div>Top category: {day.stats.topCategory ?? "-"}</div>
                              <div>Top source: {day.stats.topSource ?? "-"}</div>
                            </div>
                          </div>
                        </TooltipContent>
                      ) : null}
                    </TooltipRoot>
                  );
                })
              )}
            </div>
            <div className="mt-3 flex items-center justify-end gap-4 text-[10px] text-mutedForeground">
              <div className="flex items-center gap-2">
                <span>Loss</span>
                <div className="flex items-center gap-[2px]">
                  {negativeScale.slice(1).reverse().map((tone, index) => (
                    <span
                      key={`legend-neg-${index}`}
                      className={cn(
                        "h-[10px] w-[10px] rounded-[2px] border border-border/60",
                        tone
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="h-[10px] w-[10px] rounded-[2px] border border-border/60 bg-muted/40" />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-[2px]">
                  {positiveScale.slice(1).map((tone, index) => (
                    <span
                      key={`legend-pos-${index}`}
                      className={cn(
                        "h-[10px] w-[10px] rounded-[2px] border border-border/60",
                        tone
                      )}
                    />
                  ))}
                </div>
                <span>Profit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
