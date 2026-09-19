import type { VisualPreset } from '../../core/types';
export const farmlandPresets: VisualPreset[] = [
  {
    label: 'Official · two groups',
    source: 'LeetCode',
    input: '{"land":[[1,0,0],[0,1,1],[0,1,1]]}',
  },
  {
    label: 'Diagnostic · one row rectangle',
    source: 'Diagnostic',
    input: '{"land":[[0,1,1,1,0]]}',
  },
  {
    label: 'Diagnostic · one column rectangle',
    source: 'Diagnostic',
    input: '{"land":[[1],[1],[1],[0]]}',
  },
  { label: 'Diagnostic · single cell', source: 'Diagnostic', input: '{"land":[[0,0],[0,1]]}' },
  { label: 'Diagnostic · no farmland', source: 'Diagnostic', input: '{"land":[[0,0],[0,0]]}' },
];
