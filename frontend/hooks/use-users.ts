import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Permission, RoleDetail, User } from "@/lib/types";

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: () => api.get<User[]>("/users") });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      email: string;
      full_name: string;
      password?: string;
      role_id: string;
      department?: string;
      title?: string;
    }) => api.post<User>("/users", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Pick<User, "full_name" | "department" | "title" | "is_active">> & { role_id?: string }) =>
      api.patch<User>(`/users/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useRoles() {
  return useQuery({ queryKey: ["roles"], queryFn: () => api.get<RoleDetail[]>("/roles") });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string; permission_ids?: string[] }) =>
      api.post<RoleDetail>("/roles", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string; description?: string; permission_ids?: string[] }) =>
      api.patch<RoleDetail>(`/roles/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function usePermissions() {
  return useQuery({ queryKey: ["permissions"], queryFn: () => api.get<Permission[]>("/permissions") });
}
