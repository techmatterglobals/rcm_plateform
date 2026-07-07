"use client";

import { useState } from "react";
import { PlusIcon, UserCogIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateRoleDialog } from "@/components/admin/create-role-dialog";
import { RoleCard } from "@/components/admin/role-card";
import { useRoles } from "@/hooks/use-users";

export default function RolesPage() {
  const { data: roles, isLoading } = useRoles();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage Admin, Supervisor, and Employee access.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusIcon className="size-4" />
          New role
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : !roles || roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <UserCogIcon className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No roles yet</p>
          <p className="text-xs text-muted-foreground">Create a role to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      )}

      <CreateRoleDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
