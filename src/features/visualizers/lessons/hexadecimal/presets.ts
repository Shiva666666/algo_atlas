import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  { label: '26 becomes 1a', input: '{"num":26}', source: 'LeetCode' },
  { label: 'Negative one', input: '{"num":-1}', source: 'LeetCode' },
  { label: 'Zero', input: '{"num":0}', source: 'Diagnostic' },
  { label: 'Minimum signed integer', input: '{"num":-2147483648}', source: 'Diagnostic' },
];
