import type { VisualPreset } from '../../core/types';
export const presets: VisualPreset[] = [
  {
    label: 'Official example 1',
    input: '{"nums":[1,5,1,1,6,4]}',
    source: 'LeetCode',
  },
  {
    label: 'Official example 2',
    input: '{"nums":[1,3,2,2,3,1]}',
    source: 'LeetCode',
  },
  {
    label: 'Diagnostic 1',
    input: '{"nums":[1,2,3,4,5]}',
    source: 'Diagnostic',
  },
  {
    label: 'Diagnostic 2',
    input: '{"nums":[7]}',
    source: 'Diagnostic',
  },
  {
    label: 'Diagnostic 3',
    input: '{"nums":[1,1,2,2]}',
    source: 'Diagnostic',
  },
];
