"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileTextIcon, MegaphoneIcon, MessageCircleIcon, SparklesIcon, StarIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AssistantIcon } from "@/components/shared/assistant-icon";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { useAuth } from "@/lib/auth-context";
import { useAssistants } from "@/hooks/use-assistants";
import { useConversations } from "@/hooks/use-conversations";
import { useDocuments } from "@/hooks/use-documents";
import { usePrompts } from "@/hooks/use-prompts";
import { useNotifications } from "@/hooks/use-notifications";
import { useAnalyticsOverview } from "@/hooks/use-analytics";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isPrivileged = user?.role.name === "admin" || user?.role.name === "supervisor";

  const { data: assistants = [] } = useAssistants();
  const { data: conversations = [], isLoading: loadingConversations } = useConversations();
  const { data: documents = [], isLoading: loadingDocuments } = useDocuments();
  const { data: prompts = [] } = usePrompts();
  const { data: notifications = [] } = useNotifications();
  const { data: analytics } = useAnalyticsOverview(14);

  const announcements = notifications.filter((n) => n.type === "admin_announcement").slice(0, 4);
  const activity = notifications.filter((n) => n.type !== "admin_announcement").slice(0, 5);
  const favoritePrompts = [...prompts].sort((a, b) => b.usage_count - a.usage_count).slice(0, 4);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {user?.full_name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your RCM workspace.</p>
        </div>

        <div className="mb-8 flex gap-3 overflow-x-auto pb-1">
          {assistants.map((assistant) => (
            <Link
              key={assistant.id}
              href={assistant.slug === "ai-chat" ? "/chat" : `/${assistant.slug}`}
              className="flex min-w-36 shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-center shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <AssistantIcon name={assistant.icon} className="size-4.5" />
              </div>
              <span className="text-xs font-medium leading-tight">{assistant.name}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            {isPrivileged && analytics && (
              <Card>
                <CardHeader>
                  <CardTitle>Daily AI usage</CardTitle>
                </CardHeader>
                <CardContent className="pb-5">
                  <UsageChart data={analytics.daily_usage} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircleIcon className="size-4" /> Recent conversations
                </CardTitle>
                <Link href="/chat" className="text-xs font-medium text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 pb-5">
                {loadingConversations && <Skeleton className="h-10 w-full" />}
                {!loadingConversations && conversations.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No conversations yet — start one above.</p>
                )}
                {conversations.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    href={`/chat/${c.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent/50"
                  >
                    <span className="truncate">{c.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="size-4" /> Recently uploaded documents
                </CardTitle>
                <Link href="/document-analyzer" className="text-xs font-medium text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 pb-5">
                {loadingDocuments && <Skeleton className="h-10 w-full" />}
                {!loadingDocuments && documents.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No documents uploaded yet.</p>
                )}
                {documents.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm">
                    <span className="truncate">{d.filename}</span>
                    <Badge variant={d.status === "completed" ? "success" : d.status === "failed" ? "destructive" : "secondary"}>
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-5">
            {isPrivileged && analytics && (
              <Card>
                <CardHeader>
                  <CardTitle>Most-used assistants</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 pb-5">
                  {analytics.most_used_assistants.length === 0 && (
                    <p className="text-sm text-muted-foreground">Not enough data yet.</p>
                  )}
                  {analytics.most_used_assistants.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="truncate">{item.label}</span>
                      <span className="font-medium tabular-nums text-muted-foreground">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StarIcon className="size-4" /> Favorite prompts
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 pb-5">
                {favoritePrompts.length === 0 && <p className="text-sm text-muted-foreground">No prompts used yet.</p>}
                {favoritePrompts.map((p) => (
                  <Link
                    key={p.id}
                    href="/prompt-library"
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent/50"
                  >
                    <span className="truncate">{p.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{p.usage_count} uses</span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {announcements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MegaphoneIcon className="size-4" /> Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pb-5">
                  {announcements.map((a) => (
                    <div key={a.id} className="text-sm">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.body}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SparklesIcon className="size-4" /> Recent activity
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5 pb-5">
                {activity.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
                {activity.map((a) => (
                  <div key={a.id} className="text-sm">
                    <p>{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
