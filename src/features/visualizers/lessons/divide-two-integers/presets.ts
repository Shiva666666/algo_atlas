import type { VisualPreset } from '../../core/types';
export const presets: VisualPreset[] = [
  { label: 'Official · 10 ÷ 3 → 3', input: '{"dividend":10,"divisor":3}', source: 'LeetCode' },
  { label: 'Official · 7 ÷ −3 → −2', input: '{"dividend":7,"divisor":-3}', source: 'LeetCode' },
  {
    label: 'Zero with negative divisor · 0',
    input: '{"dividend":0,"divisor":-5}',
    source: 'Diagnostic',
  },
  {
    label: 'Smaller magnitude · −2 ÷ 3 → 0',
    input: '{"dividend":-2,"divisor":3}',
    source: 'Diagnostic',
  },
  {
    label: 'Both negative · −10 ÷ −3 → 3',
    input: '{"dividend":-10,"divisor":-3}',
    source: 'Diagnostic',
  },
  {
    label: 'Exact multiple · 24 ÷ 3 → 8',
    input: '{"dividend":24,"divisor":3}',
    source: 'Diagnostic',
  },
  {
    label: 'Many quotient bits · 31 ÷ 1 → 31',
    input: '{"dividend":31,"divisor":1}',
    source: 'Diagnostic',
  },
  {
    label: 'Overflow clamp · INT_MIN ÷ −1',
    input: '{"dividend":-2147483648,"divisor":-1}',
    source: 'Diagnostic',
  },
  {
    label: 'Minimum quotient · INT_MIN ÷ 1',
    input: '{"dividend":-2147483648,"divisor":1}',
    source: 'Diagnostic',
  },
  {
    label: 'Maximum quotient · INT_MAX ÷ 1',
    input: '{"dividend":2147483647,"divisor":1}',
    source: 'Diagnostic',
  },
  {
    label: 'Both minimum · quotient 1',
    input: '{"dividend":-2147483648,"divisor":-2147483648}',
    source: 'Diagnostic',
  },
  {
    label: 'Minimum divisor · quotient 0',
    input: '{"dividend":2147483647,"divisor":-2147483648}',
    source: 'Diagnostic',
  },
];
