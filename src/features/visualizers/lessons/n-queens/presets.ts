import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  { label: 'Two solutions · n = 4', input: '{"n":4}', source: 'LintCode' },
  { label: 'One square', input: '{"n":1}', source: 'Diagnostic' },
  { label: 'No solution · n = 2', input: '{"n":2}', source: 'Diagnostic' },
  { label: 'No solution · n = 3', input: '{"n":3}', source: 'Diagnostic' },
  { label: 'Ten solutions · n = 5', input: '{"n":5}', source: 'Diagnostic' },
];
