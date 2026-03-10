"use client";

import {
  ComposedChart,
  Area,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { usePrivateMode } from "@/components/private-mode-provider";

type PortfolioAreaChartProps = {
  data: { date: string; value: number }[];
};

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toLocaleString()}`;
}

export function PortfolioAreaChart({ data }: PortfolioAreaChartProps) {
  const { enabled } = usePrivateMode();

  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const padding = (maxVal - minVal) * 0.15 || maxVal * 0.1;
  const yDomain = [Math.max(0, minVal - padding), maxVal + padding];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id="portfolioAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2F6B5E" stopOpacity={0.25} />
              <stop offset="50%" stopColor="#2F6B5E" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#2F6B5E" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="portfolioBarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C48B2A" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#C48B2A" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="portfolioStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2F6B5E" />
              <stop offset="100%" stopColor="#1a4a40" />
            </linearGradient>
            <filter id="portfolioShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
            </filter>
          </defs>
          <CartesianGrid
            stroke="rgba(109, 103, 95, 0.08)"
            strokeDasharray="0"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={enabled ? false : { fill: "#6D675F", fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            domain={yDomain}
            tick={enabled ? false : { fill: "#6D675F", fontSize: 11, fontWeight: 500 }}
            tickFormatter={(value) => (enabled ? "" : formatCurrency(value))}
            width={55}
          />
          {enabled ? null : (
            <Tooltip
              cursor={{ stroke: "rgba(47, 107, 94, 0.2)", strokeWidth: 1 }}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                background: "rgba(255, 255, 255, 0.98)",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)",
                padding: "12px 16px",
              }}
              labelStyle={{
                color: "#6D675F",
                fontWeight: 600,
                marginBottom: 4,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => {
                if (name === "value") {
                  return [
                    <span key="value" style={{ color: "#2F6B5E", fontWeight: 600, fontSize: 15 }}>
                      {formatCurrency(value)}
                    </span>,
                    "Portfolio Value",
                  ];
                }
                return [formatCurrency(value), "Base"];
              }}
            />
          )}
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            maxBarSize={35}
            fill="url(#portfolioBarFill)"
            filter="url(#portfolioShadow)"
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="url(#portfolioStroke)"
            strokeWidth={3}
            fill="url(#portfolioAreaFill)"
            dot={{
              fill: "#fff",
              stroke: "#2F6B5E",
              strokeWidth: 2,
              r: 5,
            }}
            activeDot={{
              fill: "#2F6B5E",
              stroke: "#fff",
              strokeWidth: 3,
              r: 7,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
