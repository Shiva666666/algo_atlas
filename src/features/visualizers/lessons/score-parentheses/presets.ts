import type { VisualPreset } from '../../core/types';
export const presets: VisualPreset[] = [
  {
    label: '()',
    input: '{"s":"()"}',
    source: 'LeetCode',
  },
  {
    label: '(())',
    input: '{"s":"(())"}',
    source: 'LeetCode',
  },
  {
    label: '()()',
    input: '{"s":"()()"}',
    source: 'LeetCode',
  },
  {
    label: '(()(()))',
    input: '{"s":"(()(()))"}',
    source: 'Diagnostic',
  },
  {
    label: '((()))',
    input: '{"s":"((()))"}',
    source: 'Diagnostic',
  },
];
