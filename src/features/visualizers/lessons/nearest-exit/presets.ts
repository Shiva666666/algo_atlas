import type { VisualPreset } from '../../core/types';
export const nearestExitPresets: VisualPreset[] = [
  {
    label: 'Official · adjacent exit → 1',
    source: 'LeetCode',
    input: '{"maze":["++.+","...+","+++."],"entrance":[1,2]}',
  },
  {
    label: 'Diagnostic · entrance is not an exit',
    source: 'Diagnostic',
    input: '{"maze":["..+","+.+","+.."],"entrance":[0,0]}',
  },
  {
    label: 'Diagnostic · tied exits',
    source: 'Diagnostic',
    input: '{"maze":[".+.","...",".+."],"entrance":[1,1]}',
  },
  {
    label: 'Diagnostic · enclosed → -1',
    source: 'Diagnostic',
    input: '{"maze":["+++","+.+","+++"],"entrance":[1,1]}',
  },
  {
    label: 'Diagnostic · one row',
    source: 'Diagnostic',
    input: '{"maze":["...."],"entrance":[0,1]}',
  },
];
