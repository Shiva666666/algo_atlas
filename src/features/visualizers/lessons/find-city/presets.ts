import type { VisualPreset } from '../../core/types';
export const findCityPresets: VisualPreset[] = [
  {
    label: 'Official · threshold 4',
    source: 'LeetCode',
    input: '{"n":4,"edges":[[0,1,3],[1,2,1],[1,3,4],[2,3,1]],"distanceThreshold":4}',
  },
  {
    label: 'Diagnostic · indirect wins',
    source: 'Diagnostic',
    input: '{"n":3,"edges":[[0,1,2],[1,2,2],[0,2,9]],"distanceThreshold":4}',
  },
  {
    label: 'Diagnostic · disconnected tie',
    source: 'Diagnostic',
    input: '{"n":4,"edges":[[0,1,1]],"distanceThreshold":1}',
  },
  {
    label: 'Boundary · two cities',
    source: 'Diagnostic',
    input: '{"n":2,"edges":[[0,1,5]],"distanceThreshold":5}',
  },
];
