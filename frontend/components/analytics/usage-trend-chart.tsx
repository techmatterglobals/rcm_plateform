"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import type { UsageSeriesPoint } from "@/lib/types";

export function UsageTrendCharts({
  dailyUsage,
  monthlyUsage,
}: {
  dailyUsage: UsageSeriesPoint[];
  monthlyUsage: UsageSeriesPoint[];
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Daily usage</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <UsageChart data={dailyUsage} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Monthly usage</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <UsageChart data={monthlyUsage} />
        </CardContent>
      </Card>
    </div>
  );
}
