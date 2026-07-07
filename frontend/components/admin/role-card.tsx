"use client";

import { useState } from "react";
import { PencilIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RolePermissionsDialog } from "@/components/admin/role-permissions-dialog";
import type { RoleDetail } from "@/lib/types";

const SYSTEM_ROLE_NAMES = new Set(["admin", "supervisor", "employee"]);

export function RoleCard({ role }: { role: RoleDetail }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isSystemRole = SYSTEM_ROLE_NAMES.has(role.name);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <CardTitle>
              <Badge variant={isSystemRole ? "secondary" : "default"}>{role.name}</Badge>
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">{role.description}</p>
        </div>
        {!isSystemRole && (
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <PencilIcon className="size-3.5" />
            Edit permissions
          </Button>
        )}
      </CardHeader>
      <CardContent className="pb-5">
        {role.permissions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No permissions assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {role.permissions.map((permission) => (
              <Badge key={permission.id} variant="outline">
                {permission.code}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      {!isSystemRole && (
        <RolePermissionsDialog open={dialogOpen} onOpenChange={setDialogOpen} role={role} />
      )}
    </Card>
  );
}
