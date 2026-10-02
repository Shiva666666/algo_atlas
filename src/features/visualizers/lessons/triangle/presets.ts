import type { VisualPreset } from '../../core/types';
export const trianglePresets: VisualPreset[] = [
  {
    label: 'Official · minimum 11',
    source: 'LeetCode',
    input: '{"triangle":[[2],[3,4],[6,5,7],[4,1,8,3]]}',
  },
  { label: 'Boundary · single negative', source: 'Diagnostic', input: '{"triangle":[[-10]]}' },
  {
    label: 'Diagnostic · negative route',
    source: 'Diagnostic',
    input: '{"triangle":[[1],[-2,3],[4,-5,6]]}',
  },
  {
    label: 'Diagnostic · tied parents',
    source: 'Diagnostic',
    input: '{"triangle":[[1],[2,2],[3,3,3]]}',
  },
  {
    label: 'Diagnostic · left edge wins',
    source: 'Diagnostic',
    input: '{"triangle":[[1],[1,9],[1,9,9]]}',
  },
  {
    label: 'Diagnostic · right edge wins',
    source: 'Diagnostic',
    input: '{"triangle":[[1],[9,1],[9,9,1]]}',
  },
];
