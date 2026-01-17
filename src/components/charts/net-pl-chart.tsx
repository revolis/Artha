"use client";

import {
  ComposedChart,
  Line,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

import { usePrivateMode } from "@/components/private-mode-provider";

type NetPLChartProps = {
  data: { date: string; net: number }[];
};

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toLocaleString()}`;
}

export function NetPLChart({ data }: NetPLChartProps) {
  const { enabled } = usePrivateMode();

  const enhancedData = data.map((item) => ({
    ...item,
    barValue: item.net,
    positive: item.net >= 0,
  }));

  const maxVal = Math.max(...data.map((d) => Math.abs(d.net)), 1);
  const yDomain = [-maxVal * 1.15, maxVal * 1.15];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={enhancedData}
          margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id="netPLGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2F6B5E" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#2F6B5E" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="netPLGradientNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B04A3A" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#B04A3A" stopOpacity={0.9} />
            </linearGradient>
            <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
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
            width={60}
          />
          <ReferenceLine y={0} stroke="rgba(109, 103, 95, 0.3)" strokeWidth={1} />
          {enabled ? null : (
            <Tooltip
              cursor={{ fill: "rgba(47, 107, 94, 0.05)" }}
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
              formatter={(value: number) => [
                <span key="value" style={{ color: value >= 0 ? "#2F6B5E" : "#B04A3A", fontWeight: 600, fontSize: 15 }}>
                  {formatCurrency(value)}
                </span>,
                "Net P/L",
              ]}
            />
          )}
          <Bar
            dataKey="barValue"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          >
            {enhancedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.positive ? "url(#netPLGradient)" : "url(#netPLGradientNeg)"}
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="net"
            stroke="#1a4a40"
            strokeWidth={3}
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
