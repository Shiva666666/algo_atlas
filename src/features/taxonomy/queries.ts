import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/keys';
import type { TaxonomyResponse } from '../../shared/contracts/index';
export function useTaxonomyQuery() {
  return useQuery({
    queryKey: queryKeys.taxonomy(),
    queryFn: () => api<TaxonomyResponse>('/api/taxonomy'),
  });
}
