import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Conversation, ConversationWithMessages } from "@/lib/types";

export function useConversations(params: { search?: string; pinned?: boolean } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.pinned) query.set("pinned", "true");

  return useQuery({
    queryKey: ["conversations", params],
    queryFn: () => api.get<Conversation[]>(`/conversations?${query.toString()}`),
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ["conversations", id],
    queryFn: () => api.get<ConversationWithMessages>(`/conversations/${id}`),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { assistant_slug?: string; provider?: string; title?: string }) =>
      api.post<Conversation>("/conversations", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; title?: string; is_pinned?: boolean; is_archived?: boolean }) =>
      api.patch<Conversation>(`/conversations/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/conversations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useShareConversation() {
  return useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
      api.post(`/conversations/${id}/share`, { shared_with_user_ids: userIds }),
  });
}

export function useExportConversation() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: "markdown" | "text" }) =>
      api.get<{ filename: string; content: string }>(`/conversations/${id}/export?format=${format}`),
  });
}
