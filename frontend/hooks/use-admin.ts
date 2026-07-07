import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { AIProviderConfig, AuditLogEntry, FeatureFlag, SystemSetting } from "@/lib/types";

export function useAIProviders() {
  return useQuery({ queryKey: ["admin", "ai-providers"], queryFn: () => api.get<AIProviderConfig[]>("/admin/ai-providers") });
}

export function useUpdateAIProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<AIProviderConfig> & { api_key?: string }) =>
      api.patch<AIProviderConfig>(`/admin/ai-providers/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "ai-providers"] }),
  });
}

export function useFeatureFlags() {
  return useQuery({ queryKey: ["admin", "feature-flags"], queryFn: () => api.get<FeatureFlag[]>("/admin/feature-flags") });
}

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_enabled }: { id: string; is_enabled: boolean }) =>
      api.patch<FeatureFlag>(`/admin/feature-flags/${id}`, { is_enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] }),
  });
}

export function useSystemSettings() {
  return useQuery({ queryKey: ["admin", "settings"], queryFn: () => api.get<SystemSetting[]>("/admin/settings") });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: Record<string, unknown> }) =>
      api.put<SystemSetting>(`/admin/settings/${key}`, { value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "settings"] }),
  });
}

export function useCreateAnnouncement() {
  return useMutation({
    mutationFn: (payload: { title: string; body: string; link?: string }) =>
      api.post("/admin/announcements", payload),
  });
}

export function useAuditLogs(action?: string) {
  return useQuery({
    queryKey: ["admin", "audit-logs", action],
    queryFn: () => api.get<AuditLogEntry[]>(`/audit-logs${action ? `?action=${action}` : ""}`),
  });
}

export interface AdminConversation {
  id: string;
  title: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  assistant_name: string | null;
  provider: string;
  is_archived: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export function useAdminConversations(limit = 100) {
  return useQuery({
    queryKey: ["admin", "conversations", limit],
    queryFn: () => api.get<AdminConversation[]>(`/admin/conversations?limit=${limit}`),
  });
}

export function useAdminDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/conversations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "conversations"] }),
  });
}
