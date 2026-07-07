import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { PromptTemplate } from "@/lib/types";

export function usePrompts(params: { category?: string; search?: string } = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);

  return useQuery({
    queryKey: ["prompts", params],
    queryFn: () => api.get<PromptTemplate[]>(`/prompts?${query.toString()}`),
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; description?: string; category: string; content: string }) =>
      api.post<PromptTemplate>("/prompts", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompts"] }),
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<PromptTemplate>) =>
      api.patch<PromptTemplate>(`/prompts/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompts"] }),
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/prompts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompts"] }),
  });
}

export function useLaunchPrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<PromptTemplate>(`/prompts/${id}/launch`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompts"] }),
  });
}
