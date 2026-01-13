"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

import { usePrivateMode } from "@/components/private-mode-provider";

type NetPLChartProps = {
  data: { date: string; net: number }[];
};

export function NetPLChart({ data }: NetPLChartProps) {
  const { enabled } = usePrivateMode();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              formatter={(value: number) => [`$${value}`, "Net P/L"]}
            />
          )}
          <Line
            type="monotone"
            dataKey="net"
            stroke="#2F6B5E"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
