"use client";

import { BellIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useMarkNotificationRead, useNotifications } from "@/hooks/use-notifications";

export function NotificationsMenu() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8">
          <BellIcon className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        {notifications.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">You&apos;re all caught up</p>
        )}
        {notifications.slice(0, 8).map((n) => (
          <DropdownMenuItem
            key={n.id}
            className="flex flex-col items-start gap-0.5 whitespace-normal"
            onClick={() => !n.is_read && markRead.mutate(n.id)}
          >
            <div className="flex w-full items-center gap-2">
              <span className="flex-1 truncate text-sm font-medium">{n.title}</span>
              {!n.is_read && <Badge className="size-1.5 rounded-full p-0" />}
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
