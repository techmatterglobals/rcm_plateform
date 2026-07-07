import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { KBDocument, KBSearchResult } from "@/lib/types";

export function useKBDocuments(category?: string) {
  return useQuery({
    queryKey: ["kb-documents", category],
    queryFn: () => api.get<KBDocument[]>(`/knowledge-base/documents${category ? `?category=${category}` : ""}`),
    refetchInterval: (query) =>
      query.state.data?.some((d) => d.status === "indexing" || d.status === "pending") ? 4000 : false,
  });
}

export function useUploadKBDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, title, category }: { file: File; title: string; category: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload<KBDocument>(
        `/knowledge-base/documents?title=${encodeURIComponent(title)}&category=${encodeURIComponent(category)}`,
        formData
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kb-documents"] }),
  });
}

export function useDeleteKBDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/knowledge-base/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kb-documents"] }),
  });
}

export function useReindexKBDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/knowledge-base/documents/${id}/reindex`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kb-documents"] }),
  });
}

export function useSearchKB() {
  return useMutation({
    mutationFn: (payload: { query: string; category?: string; top_k?: number }) =>
      api.post<KBSearchResult[]>("/knowledge-base/search", payload),
  });
}
