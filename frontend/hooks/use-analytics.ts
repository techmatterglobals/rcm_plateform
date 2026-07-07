import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { AnalyticsOverview } from "@/lib/types";

export function useAnalyticsOverview(days = 30) {
  return useQuery({
    queryKey: ["analytics", "overview", days],
    queryFn: () => api.get<AnalyticsOverview>(`/analytics/overview?days=${days}`),
  });
}
