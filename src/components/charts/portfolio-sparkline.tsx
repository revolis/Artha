"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

import { usePrivateMode } from "@/components/private-mode-provider";

type PortfolioSparklineProps = {
  data: { date: string; value: number }[];
};

export function PortfolioSparkline({ data }: PortfolioSparklineProps) {
  const { enabled } = usePrivateMode();

  return (
    <div className="h-16 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {enabled ? null : (
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid rgba(226, 217, 207, 0.8)",
                background: "#fff"
              }}
              formatter={(value: number) => [`$${value}`, "Portfolio"]}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2F6B5E"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
