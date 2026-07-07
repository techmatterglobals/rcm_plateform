"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3Icon,
  BotIcon,
  FlagIcon,
  Loader2Icon,
  MessageSquareIcon,
  ScrollTextIcon,
  ShieldIcon,
  TimerIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: ShieldIcon, exact: true },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/roles", label: "Roles & Permissions", icon: UserCogIcon },
  { href: "/admin/providers", label: "AI Providers & API Keys", icon: BotIcon },
  { href: "/admin/conversations", label: "Conversations", icon: MessageSquareIcon },
  { href: "/admin/feature-flags", label: "Feature Flags", icon: FlagIcon },
  { href: "/admin/retention", label: "Retention & Compliance", icon: TimerIcon },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollTextIcon },
  { href: "/analytics", label: "Analytics", icon: BarChart3Icon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && user && user.role.name !== "admin") {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role.name !== "admin") {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <aside className="hidden w-56 shrink-0 flex-col gap-0.5 border-r border-border px-3 py-5 md:flex">
        <p className="px-2.5 pb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Admin</p>
        {ADMIN_NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </aside>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
