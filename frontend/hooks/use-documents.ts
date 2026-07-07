import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { AppDocument, DocumentSource } from "@/lib/types";

export function useDocuments(source?: DocumentSource) {
  return useQuery({
    queryKey: ["documents", source],
    queryFn: () => api.get<AppDocument[]>(`/documents${source ? `?source=${source}` : ""}`),
    refetchInterval: (query) =>
      query.state.data?.some((d) => d.status === "processing" || d.status === "uploaded") ? 4000 : false,
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ["documents", "detail", id],
    queryFn: () => api.get<AppDocument>(`/documents/${id}`),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data && ["processing", "uploaded"].includes(query.state.data.status) ? 3000 : false,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, source }: { file: File; source: DocumentSource }) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload<AppDocument>(`/documents/upload?source=${source}`, formData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });
}
