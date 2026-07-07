"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateUser, useRoles, useUpdateUser } from "@/hooks/use-users";
import { ApiError } from "@/lib/api-client";
import type { User } from "@/lib/types";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  full_name: z.string().min(1, "Full name is required"),
  department: z.string().optional(),
  title: z.string().optional(),
  role_id: z.string().min(1, "Select a role"),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}) {
  const isEdit = !!user;
  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      full_name: "",
      department: "",
      title: "",
      role_id: "",
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        email: user?.email ?? "",
        full_name: user?.full_name ?? "",
        department: user?.department ?? "",
        title: user?.title ?? "",
        role_id: user?.role.id ?? "",
        password: "",
      });
    }
  }, [open, user, reset]);

  const roleId = watch("role_id");

  const onSubmit = async (values: FormValues) => {
    if (!isEdit && (!values.password || values.password.length < 8)) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      if (isEdit && user) {
        await updateUser.mutateAsync({
          id: user.id,
          full_name: values.full_name,
          department: values.department || undefined,
          title: values.title || undefined,
          role_id: values.role_id,
        });
        toast.success("User updated");
      } else {
        await createUser.mutateAsync({
          email: values.email,
          full_name: values.full_name,
          department: values.department || undefined,
          title: values.title || undefined,
          role_id: values.role_id,
          password: values.password,
        });
        toast.success("User created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "New user"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update role, department, or title for this user." : "Create a new employee account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@techmatter.co"
              disabled={isEdit}
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" placeholder="Jane Doe" {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="department">Department</Label>
              <Input id="department" placeholder="Billing" {...register("department")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Billing Specialist" {...register("title")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role_id">Role</Label>
            <Select value={roleId} onValueChange={(value) => setValue("role_id", value, { shouldValidate: true })}>
              <SelectTrigger id="role_id" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role_id && <p className="text-xs text-destructive">{errors.role_id.message}</p>}
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
