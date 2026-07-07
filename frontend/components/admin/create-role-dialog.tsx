"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRole, usePermissions } from "@/hooks/use-users";
import { ApiError } from "@/lib/api-client";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateRoleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: permissions, isLoading } = usePermissions();
  const createRole = useCreateRole();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ name: "", description: "" });
      setSelected(new Set());
    }
  }, [open, reset]);

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await createRole.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        permission_ids: Array.from(selected),
      });
      toast.success("Role created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New role</DialogTitle>
          <DialogDescription>Create a custom role and assign permissions.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Billing Reviewer" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="What this role is for" {...register("description")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Permissions</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading permissions…</p>
            ) : (
              <ScrollArea className="max-h-64 rounded-lg border border-border">
                <div className="flex flex-col gap-3 p-3">
                  {permissions?.map((permission) => (
                    <div key={permission.id} className="flex items-start gap-2.5">
                      <Checkbox
                        id={`create-permission-${permission.id}`}
                        checked={selected.has(permission.id)}
                        onCheckedChange={(checked) => toggle(permission.id, checked === true)}
                        className="mt-0.5"
                      />
                      <Label htmlFor={`create-permission-${permission.id}`} className="flex flex-col gap-0.5 font-normal">
                        <span className="text-sm font-medium">{permission.code}</span>
                        <span className="text-xs text-muted-foreground">{permission.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
              Create role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
