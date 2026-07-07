"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  BotIcon,
  FlagIcon,
  MessageSquareIcon,
  ScrollTextIcon,
  TimerIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SECTIONS = [
  {
    href: "/admin/users",
    icon: UsersIcon,
    title: "Users",
    description: "Create, edit, and deactivate employee accounts.",
  },
  {
    href: "/admin/roles",
    icon: UserCogIcon,
    title: "Roles & Permissions",
    description: "Manage Admin, Supervisor, and Employee access.",
  },
  {
    href: "/admin/providers",
    icon: BotIcon,
    title: "AI Providers & API Keys",
    description: "Configure Claude, GPT, and Gemini credentials and defaults.",
  },
  {
    href: "/admin/conversations",
    icon: MessageSquareIcon,
    title: "Conversations",
    description: "Review and moderate conversations across the company.",
  },
  {
    href: "/admin/feature-flags",
    icon: FlagIcon,
    title: "Feature Flags",
    description: "Turn platform features on or off without a deploy.",
  },
  {
    href: "/admin/retention",
    icon: TimerIcon,
    title: "Retention & Compliance",
    description: "PHI handling policy, session timeout, retention windows.",
  },
  {
    href: "/admin/audit-logs",
    icon: ScrollTextIcon,
    title: "Audit Logs",
    description: "Every sensitive action, who did it, and when.",
  },
];

export default function AdminOverviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage users, providers, compliance, and platform configuration.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/30">
                <CardHeader className="flex-row items-start justify-between">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4.5" />
                  </div>
                  <ArrowRightIcon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-5">
                  <CardTitle className="mb-1 text-sm">{section.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
