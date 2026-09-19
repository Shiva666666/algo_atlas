import type { VisualPreset } from '../../core/types';

export const keysRoomsPresets: VisualPreset[] = [
  { label: 'Official · key chain → true', source: 'LeetCode', input: '{"rooms":[[1],[2],[3],[]]}' },
  {
    label: 'Official · trapped room → false',
    source: 'LeetCode',
    input: '{"rooms":[[1,3],[3,0,1],[2],[0]]}',
  },
  {
    label: 'Diagnostic · duplicate discovery',
    source: 'Diagnostic',
    input: '{"rooms":[[1,2],[2,3],[3],[]]}',
  },
  {
    label: 'Diagnostic · cycle and self-key',
    source: 'Diagnostic',
    input: '{"rooms":[[0,1],[2],[1,3],[]]}',
  },
];
