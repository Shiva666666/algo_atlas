import type { VisualPreset } from '../../core/types';
export const presets: VisualPreset[] = [
  {
    label: 'Official example · 3',
    input: '{"courses":[[100,200],[200,1300],[1000,1250],[2000,3200]]}',
    source: 'LeetCode',
  },
  {
    label: 'Replacement frees time · 2',
    input: '{"courses":[[5,5],[4,6],[2,6]]}',
    source: 'Diagnostic',
  },
  { label: 'One feasible · 1', input: '{"courses":[[1,2]]}', source: 'LeetCode' },
  { label: 'All impossible · 0', input: '{"courses":[[3,2],[4,3]]}', source: 'LeetCode' },
  { label: 'Exact deadline · 1', input: '{"courses":[[3,3]]}', source: 'Diagnostic' },
  {
    label: 'Equal duration cannot replace · 1',
    input: '{"courses":[[2,2],[2,3]]}',
    source: 'Diagnostic',
  },
  { label: 'Duplicate courses · 2', input: '{"courses":[[1,2],[1,2]]}', source: 'Diagnostic' },
  {
    label: 'Unsorted deadlines · 3',
    input: '{"courses":[[2,5],[1,2],[2,3]]}',
    source: 'Diagnostic',
  },
  {
    label: 'Repeated replacement · 2',
    input: '{"courses":[[5,5],[4,6],[3,7],[2,7]]}',
    source: 'Diagnostic',
  },
  { label: 'Maximum boundary · 1', input: '{"courses":[[10000,10000]]}', source: 'Diagnostic' },
];
