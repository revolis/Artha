"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

import { usePrivateMode } from "@/components/private-mode-provider";

type PortfolioAreaChartProps = {
  data: { date: string; value: number }[];
};

export function PortfolioAreaChart({ data }: PortfolioAreaChartProps) {
  const { enabled } = usePrivateMode();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2F6B5E" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2F6B5E" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(109, 103, 95, 0.15)" strokeDasharray="4 4" />
          <XAxis dataKey="date" tick={enabled ? false : { fill: "#6D675F" }} />
          <YAxis
            tick={enabled ? false : { fill: "#6D675F" }}
            tickFormatter={(value) => (enabled ? "" : `$${value}`)}
          />
          {enabled ? null : (
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid rgba(226, 217, 207, 0.8)",
                background: "#fff"
              }}
              formatter={(value: number) => [`$${value}`, "Portfolio"]}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2F6B5E"
            strokeWidth={2}
            fill="url(#portfolioFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
