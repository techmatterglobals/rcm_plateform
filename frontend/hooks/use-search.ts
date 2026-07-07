import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { SearchResults } from "@/lib/types";

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => api.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 1,
  });
}
