import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  {
    label: 'Default · expand then shrink',
    input: '{"nums":[8,2,4,7],"limit":4}',
    source: 'LeetCode',
  },
  { label: 'Long middle window', input: '{"nums":[10,1,2,4,7,2],"limit":5}', source: 'LeetCode' },
  {
    label: 'Duplicates · limit zero',
    input: '{"nums":[4,2,2,2,4,4,2,2],"limit":0}',
    source: 'LeetCode',
  },
  { label: 'Singleton', input: '{"nums":[5],"limit":0}', source: 'Diagnostic' },
  { label: 'Increasing values', input: '{"nums":[1,2,3,4,5],"limit":3}', source: 'Diagnostic' },
  {
    label: 'Duplicate block + spike',
    input: '{"nums":[1,1,1,10,1,1],"limit":0}',
    source: 'Diagnostic',
  },
];
