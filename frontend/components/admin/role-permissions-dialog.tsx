"use client";

import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePermissions, useUpdateRole } from "@/hooks/use-users";
import { ApiError } from "@/lib/api-client";
import type { RoleDetail } from "@/lib/types";

export function RolePermissionsDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDetail;
}) {
  const { data: permissions, isLoading } = usePermissions();
  const updateRole = useUpdateRole();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(new Set(role.permissions.map((permission) => permission.id)));
    }
  }, [open, role]);

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateRole.mutateAsync({ id: role.id, permission_ids: Array.from(selected) });
      toast.success("Permissions updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit permissions</DialogTitle>
          <DialogDescription>Choose the permissions granted to the &ldquo;{role.name}&rdquo; role.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading permissions…</p>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="flex flex-col gap-3 pr-3">
              {permissions?.map((permission) => (
                <div key={permission.id} className="flex items-start gap-2.5">
                  <Checkbox
                    id={`permission-${permission.id}`}
                    checked={selected.has(permission.id)}
                    onCheckedChange={(checked) => toggle(permission.id, checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor={`permission-${permission.id}`} className="flex flex-col gap-0.5 font-normal">
                    <span className="text-sm font-medium">{permission.code}</span>
                    <span className="text-xs text-muted-foreground">{permission.description}</span>
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2Icon className="size-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
