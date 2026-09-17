import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  { label: 'Default · n = 3', input: '{"n":3}', source: 'LeetCode' },
  { label: 'Single pair', input: '{"n":1}', source: 'Diagnostic' },
  { label: 'Empty result', input: '{"n":0}', source: 'Diagnostic' },
  { label: 'Four pairs', input: '{"n":4}', source: 'Diagnostic' },
];
