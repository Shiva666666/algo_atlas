import type { VisualPreset } from '../../core/types';
export const depthPresets: VisualPreset[] = [
  {
    label: 'Official · arithmetic depth 3',
    source: 'LeetCode',
    input: '{"s":"(1+(2*3)+((8)/4))+1"}',
  },
  { label: 'Diagnostic · no parentheses', source: 'Diagnostic', input: '{"s":"1+2*3"}' },
  { label: 'Diagnostic · adjacent pairs', source: 'Diagnostic', input: '{"s":"()()"}' },
  { label: 'Diagnostic · deep nesting', source: 'Diagnostic', input: '{"s":"((((1))))"}' },
  { label: 'Diagnostic · repeated maximum', source: 'Diagnostic', input: '{"s":"((1))+((2))"}' },
  { label: 'Diagnostic · mixed arithmetic', source: 'Diagnostic', input: '{"s":"(1)+(2/(3-4))"}' },
];
