import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  {
    label: 'Default · answer 13',
    input: '{"matrix":[[2,1,3],[6,5,4],[7,8,9]]}',
    source: 'LeetCode',
  },
  { label: 'Negative values', input: '{"matrix":[[-19,57],[-40,-5]]}', source: 'LeetCode' },
  { label: 'Single cell', input: '{"matrix":[[-7]]}', source: 'Diagnostic' },
  {
    label: 'Boundary diagonals matter',
    input: '{"matrix":[[9,2,9],[1,8,1],[9,1,9]]}',
    source: 'Diagnostic',
  },
];
