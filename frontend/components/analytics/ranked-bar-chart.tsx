"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { TopItem } from "@/lib/types";

export function RankedBarChart({ data, valueLabel = "Value" }: { data: TopItem[]; valueLabel?: string }) {
  if (!data.length) {
    return <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">Not enough data yet</p>;
  }

  const height = Math.max(data.length * 40, 120);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={140}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--accent)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [String(value), valueLabel]}
        />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={16}>
          <LabelList
            dataKey="value"
            position="right"
            style={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
