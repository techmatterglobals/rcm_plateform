"use client";

import { useState } from "react";
import {
  AlertTriangleIcon,
  BarChart3Icon,
  ClockIcon,
  DollarSignIcon,
  FileUpIcon,
  Loader2Icon,
  MessageCircleIcon,
  MessagesSquareIcon,
  SearchIcon,
  SparklesIcon,
  TimerIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsageTrendCharts } from "@/components/analytics/usage-trend-chart";
import { RankedBarChart } from "@/components/analytics/ranked-bar-chart";
import { useAuth } from "@/lib/auth-context";
import { useAnalyticsOverview } from "@/hooks/use-analytics";

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

function formatResponseTime(ms: number): string {
  if (ms > 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="truncate text-lg font-semibold tabular-nums leading-tight">{value}</span>
          {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [days, setDays] = useState("30");
  const isPrivileged = user?.role.name === "admin" || user?.role.name === "supervisor";

  const { data: analytics, isLoading, isError } = useAnalyticsOverview(Number(days));

  if (!isPrivileged) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-24 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BarChart3Icon className="size-6" />
            </div>
            <div>
              <p className="font-medium">Analytics is available to Supervisors and Admins</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask your admin for access if you need workspace usage insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">Usage and adoption insights across the workspace.</p>
          </div>
          <Tabs value={days} onValueChange={setDays}>
            <TabsList>
              {RANGE_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-24 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <AlertTriangleIcon className="size-6" />
            </div>
            <div>
              <p className="font-medium">Couldn&apos;t load analytics</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You may not have access, or something went wrong. Try again later.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && analytics && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <StatTile
                icon={ClockIcon}
                label="Avg. response time"
                value={formatResponseTime(analytics.average_response_time_ms)}
              />
              <StatTile
                icon={MessagesSquareIcon}
                label="Avg. conversation length"
                value={`${analytics.average_conversation_length.toFixed(1)}`}
                hint="messages/conversation"
              />
              <StatTile
                icon={TimerIcon}
                label="Est. time saved"
                value={`${analytics.estimated_time_saved_hours.toFixed(1)} hrs`}
                hint="Estimate, not measured"
              />
              <StatTile
                icon={DollarSignIcon}
                label="Est. API cost"
                value={formatCurrency(analytics.estimated_api_cost_usd)}
                hint="Estimate for selected range"
              />
              <StatTile icon={SearchIcon} label="Knowledge base searches" value={String(analytics.knowledge_base_searches)} />
              <StatTile icon={FileUpIcon} label="Document uploads" value={String(analytics.document_uploads)} />
              <StatTile icon={MessageCircleIcon} label="Total conversations" value={String(analytics.total_conversations)} />
              <StatTile icon={SparklesIcon} label="Total messages" value={String(analytics.total_messages)} />
            </div>

            <UsageTrendCharts dailyUsage={analytics.daily_usage} monthlyUsage={analytics.monthly_usage} />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUpIcon className="size-4" /> Most-used assistants
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-5">
                  <RankedBarChart data={analytics.most_used_assistants} valueLabel="Uses" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SparklesIcon className="size-4" /> Most-used prompts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-5">
                  <RankedBarChart data={analytics.most_used_prompts} valueLabel="Uses" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="size-4" /> Top active users
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-5">
                  <RankedBarChart data={analytics.top_active_users} valueLabel="Messages" />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
