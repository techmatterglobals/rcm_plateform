"use client";

import Link from "next/link";
import { SparklesIcon } from "lucide-react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { AuthGuard } from "@/components/shared/auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
          <Link href="/dashboard" className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <SparklesIcon className="size-4" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">RCM AI Platform</span>
          </Link>
          <SidebarNav />
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
