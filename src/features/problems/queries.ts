import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/keys';
import type { Problem } from '../../shared/contracts/index';
export function useProblemQuery(problemId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.problem(problemId),
    queryFn: () => api<Problem>(`/api/problems/${problemId}`),
    enabled: !!problemId,
  });
}
