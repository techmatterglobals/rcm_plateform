import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Assistant } from "@/lib/types";

export function useAssistants() {
  return useQuery({
    queryKey: ["assistants"],
    queryFn: () => api.get<Assistant[]>("/assistants"),
  });
}

export function useAssistant(slug: string | undefined) {
  return useQuery({
    queryKey: ["assistants", slug],
    queryFn: () => api.get<Assistant>(`/assistants/${slug}`),
    enabled: !!slug,
  });
}
