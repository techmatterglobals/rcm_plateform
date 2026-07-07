"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import type { UsageSeriesPoint } from "@/lib/types";

export function UsageChart({ data }: { data: UsageSeriesPoint[] }) {
  if (!data.length) {
    return <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">No usage data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(value: string) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          minTickGap={24}
        />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(value) => new Date(String(value)).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          formatter={(value) => [String(value), "Messages"]}
        />
        <Area type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2} fill="url(#usageFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
