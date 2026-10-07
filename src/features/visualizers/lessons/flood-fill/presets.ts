import type { VisualPreset } from '../../core/types';
export const presets: VisualPreset[] = [
  {
    label: 'Official example 1',
    input: '{"image":[[1,1,1],[1,1,0],[1,0,1]],"sr":1,"sc":1,"color":2}',
    source: 'LeetCode',
  },
  {
    label: 'Official example 2',
    input: '{"image":[[0,0,0],[0,0,0]],"sr":0,"sc":0,"color":0}',
    source: 'LeetCode',
  },
  {
    label: 'Diagnostic 1',
    input: '{"image":[[1,1],[1,1]],"sr":0,"sc":0,"color":2}',
    source: 'Diagnostic',
  },
  {
    label: 'Diagnostic 2',
    input: '{"image":[[0,1],[1,0]],"sr":0,"sc":0,"color":3}',
    source: 'Diagnostic',
  },
];
