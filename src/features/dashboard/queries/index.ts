import { useQuery } from '@tanstack/react-query';
import { api } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/keys';
import type { Analytics } from '../../../shared/contracts/index';
export function useAnalyticsQuery() {
  return useQuery({
    queryKey: queryKeys.analytics(),
    queryFn: () => api<Analytics>('/api/analytics/overview'),
  });
}
