import type { VisualPreset } from '../../core/types';
export const presets: VisualPreset[] = [
  {
    label: 'Official example · [1,0,2,1]',
    input: '{"encoded":[1,2,3],"first":1}',
    source: 'LeetCode',
  },
  {
    label: 'Official example · [4,2,0,7,4]',
    input: '{"encoded":[6,2,7,3],"first":4}',
    source: 'LeetCode',
  },
  { label: 'All zeros', input: '{"encoded":[0,0,0],"first":0}', source: 'Diagnostic' },
  {
    label: 'Zero preserves the previous value',
    input: '{"encoded":[0],"first":9}',
    source: 'Diagnostic',
  },
  {
    label: 'Repeated XOR alternates',
    input: '{"encoded":[7,7,7],"first":5}',
    source: 'Diagnostic',
  },
  {
    label: 'Output can exceed input bound',
    input: '{"encoded":[65535],"first":65536}',
    source: 'Diagnostic',
  },
  {
    label: 'Maximum inputs cancel',
    input: '{"encoded":[100000],"first":100000}',
    source: 'Diagnostic',
  },
  { label: 'Zero first value', input: '{"encoded":[5],"first":0}', source: 'Diagnostic' },
];
