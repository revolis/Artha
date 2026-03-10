"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

import { usePrivateMode } from "@/components/private-mode-provider";

const palette = ["#2F6B5E", "#C48B2A", "#B04A3A", "#6D675F", "#8CA6A0"];

type CategoryDonutProps = {
  data: { name: string; value: number }[];
};

export function CategoryDonut({ data }: CategoryDonutProps) {
  const { enabled } = usePrivateMode();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {enabled ? null : (
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid rgba(226, 217, 207, 0.8)",
                background: "#fff"
              }}
              formatter={(value: number, _name: string, props: { payload?: { name?: string } }) => [
                `${value}%`,
                props.payload?.name ?? "Category"
              ]}
            />
          )}
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}`} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            formatter={(value: string, entry: { payload?: { value?: number } }) => {
              const percent = entry.payload?.value ?? 0;
              return enabled ? value : `${value} ${percent}%`;
            }}
            wrapperStyle={{ fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
