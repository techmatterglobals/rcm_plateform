"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangleIcon,
  BarChart3Icon,
  BookOpenIcon,
  ClipboardCheckIcon,
  ConciergeBellIcon,
  FileEditIcon,
  FileTextIcon,
  HashIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  MessageCircleIcon,
  ReceiptIcon,
  ScanSearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const NAV_SECTIONS = [
  {
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon }],
  },
  {
    label: "Assistants",
    items: [
      { href: "/chat", label: "AI Chat", icon: MessageCircleIcon },
      { href: "/medical-coding", label: "Medical Coding", icon: HashIcon },
      { href: "/medical-billing", label: "Medical Billing", icon: ReceiptIcon },
      { href: "/eligibility-vob", label: "Eligibility & VOB", icon: ShieldCheckIcon },
      { href: "/prior-authorization", label: "Prior Authorization", icon: ClipboardCheckIcon },
      { href: "/denial-management", label: "Denial Management", icon: AlertTriangleIcon },
      { href: "/appeal-generator", label: "Appeal Generator", icon: FileEditIcon },
      { href: "/medical-record-review", label: "Medical Record Review", icon: FileTextIcon },
      { href: "/document-analyzer", label: "Document Analyzer", icon: ScanSearchIcon },
      { href: "/virtual-front-desk", label: "Virtual Front Desk", icon: ConciergeBellIcon },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpenIcon },
      { href: "/prompt-library", label: "Prompt Library", icon: LibraryIcon },
      { href: "/analytics", label: "Analytics", icon: BarChart3Icon },
    ],
  },
  {
    label: "Workspace",
    items: [{ href: "/settings", label: "Settings", icon: SettingsIcon }],
  },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role.name === "admin";

  return (
    <nav className="flex flex-col gap-4 overflow-y-auto px-3 py-2">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label ?? "root"} className="flex flex-col gap-0.5">
          {section.label && (
            <p className="px-2.5 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}

      {isAdmin && (
        <div className="flex flex-col gap-0.5">
          <p className="px-2.5 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Administration
          </p>
          <Link
            href="/admin"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <ShieldIcon className="size-4 shrink-0" />
            Admin
          </Link>
        </div>
      )}
    </nav>
  );
}
