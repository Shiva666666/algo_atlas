import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  {
    label: 'Default · area 4',
    input: '{"matrix":[["1","0","1"],["1","1","1"],["1","1","1"]]}',
    source: 'LeetCode',
  },
  { label: 'All zeros', input: '{"matrix":[["0","0"],["0","0"]]}', source: 'Diagnostic' },
  { label: 'Single cell', input: '{"matrix":[["1"]]}', source: 'Diagnostic' },
  {
    label: 'Rectangular grid',
    input: '{"matrix":[["1","1","1","1"],["1","1","1","1"]]}',
    source: 'Diagnostic',
  },
];
