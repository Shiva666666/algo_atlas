import type { VisualPreset } from '../../core/types';

export const completeComponentsPresets: VisualPreset[] = [
  {
    label: 'Official · triangle, pair, isolated → 3',
    source: 'LeetCode',
    input: '{"n":6,"edges":[[0,1],[0,2],[1,2],[3,4]]}',
  },
  {
    label: 'Diagnostic · path is incomplete',
    source: 'Diagnostic',
    input: '{"n":3,"edges":[[0,1],[1,2]]}',
  },
  {
    label: 'Diagnostic · clique missing one edge',
    source: 'Diagnostic',
    input: '{"n":4,"edges":[[0,1],[0,2],[0,3],[1,2],[1,3]]}',
  },
  { label: 'Diagnostic · all isolated → 5', source: 'Diagnostic', input: '{"n":5,"edges":[]}' },
];
