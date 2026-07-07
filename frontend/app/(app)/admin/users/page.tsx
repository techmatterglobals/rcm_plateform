"use client";

import { useState } from "react";
import { PlusIcon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserFormDialog } from "@/components/admin/user-form-dialog";
import { UserTable } from "@/components/admin/user-table";
import { useUsers } from "@/hooks/use-users";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  const openCreate = () => {
    setEditingUser(undefined);
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, edit, and deactivate employee accounts.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="size-4" />
          New user
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !users || users.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <UsersIcon className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No users yet</p>
          <p className="text-xs text-muted-foreground">Create the first user to get started.</p>
        </div>
      ) : (
        <UserTable users={users} onEdit={openEdit} />
      )}

      <UserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editingUser} />
    </div>
  );
}
