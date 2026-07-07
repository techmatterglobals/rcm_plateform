"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 lg:hidden">
          <SheetHeader className="border-b border-border">
            <SheetTitle>RCM AI Platform</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <Button variant="ghost" size="icon" className="size-8 lg:hidden" onClick={() => setMobileOpen(true)}>
        <MenuIcon className="size-4" />
      </Button>

      <div className="hidden lg:block">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="lg:hidden">
          <GlobalSearch />
        </div>
        <NotificationsMenu />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
