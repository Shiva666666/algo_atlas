import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  { label: 'Four combinations', input: '{"coins":[1,2,5],"amount":5}', source: 'LeetCode' },
  { label: 'Impossible amount', input: '{"coins":[2],"amount":3}', source: 'LeetCode' },
  { label: 'One denomination', input: '{"coins":[10],"amount":10}', source: 'LeetCode' },
  { label: 'Zero amount', input: '{"coins":[1,2],"amount":0}', source: 'Diagnostic' },
];
