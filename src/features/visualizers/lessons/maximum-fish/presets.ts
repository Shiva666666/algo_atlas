import type { VisualPreset } from '../../core/types';
export const maximumFishPresets: VisualPreset[] = [
  {
    label: 'Official · two ponds',
    source: 'LeetCode',
    input: '{"grid":[[0,2,1,0],[4,0,0,3],[1,0,0,4],[0,3,2,0]]}',
  },
  { label: 'Diagnostic · all dry', source: 'Diagnostic', input: '{"grid":[[0,0],[0,0]]}' },
  { label: 'Diagnostic · diagonal ponds', source: 'Diagnostic', input: '{"grid":[[5,0],[0,5]]}' },
  {
    label: 'Diagnostic · winding pond',
    source: 'Diagnostic',
    input: '{"grid":[[1,1,0],[0,2,0],[3,4,0]]}',
  },
];
