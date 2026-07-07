"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeactivateUser } from "@/hooks/use-users";
import { ApiError } from "@/lib/api-client";
import type { User } from "@/lib/types";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserTable({ users, onEdit }: { users: User[]; onEdit: (user: User) => void }) {
  const [pendingDeactivate, setPendingDeactivate] = useState<User | null>(null);
  const deactivateUser = useDeactivateUser();

  const handleDeactivate = async () => {
    if (!pendingDeactivate) return;
    try {
      await deactivateUser.mutateAsync(pendingDeactivate.id);
      toast.success(`${pendingDeactivate.full_name} has been deactivated`);
      setPendingDeactivate(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to deactivate user");
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                      <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.full_name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role.name}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.department || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.title || "—"}</TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "success" : "secondary"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.last_login_at ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true }) : "Never"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(user)}>Edit</DropdownMenuItem>
                      {user.is_active && (
                        <DropdownMenuItem variant="destructive" onClick={() => setPendingDeactivate(user)}>
                          Deactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!pendingDeactivate} onOpenChange={(open) => !open && setPendingDeactivate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate user</DialogTitle>
            <DialogDescription>
              {pendingDeactivate
                ? `${pendingDeactivate.full_name} will lose access to the platform. This can be reversed by an admin later.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeactivate(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={deactivateUser.isPending}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
