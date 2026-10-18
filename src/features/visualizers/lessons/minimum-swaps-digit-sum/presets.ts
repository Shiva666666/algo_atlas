import type { VisualPreset } from '../../core/types';
export const presets: VisualPreset[] = [
  { label: 'Ties and swaps · 2', input: '{"nums":[18,43,34,16]}', source: 'LeetCode' },
  { label: 'Digit sum, not value · 1', input: '{"nums":[37,100]}', source: 'LeetCode' },
  { label: 'Already sorted · 0', input: '{"nums":[22,14,33,7]}', source: 'LeetCode' },
  { label: 'Singleton · 0', input: '{"nums":[1]}', source: 'Diagnostic' },
  { label: 'All keys tied · 2', input: '{"nums":[31,13,22]}', source: 'Diagnostic' },
  { label: 'Internal zeros · 2', input: '{"nums":[2,11,1000]}', source: 'Diagnostic' },
  { label: 'Four-position cycle · 3', input: '{"nums":[2,3,4,1]}', source: 'Diagnostic' },
  { label: 'Independent cycles · 2', input: '{"nums":[2,1,4,3]}', source: 'Diagnostic' },
  { label: 'Maximum value · 1', input: '{"nums":[1000000000,1]}', source: 'Diagnostic' },
  { label: 'Correct suffix · 1', input: '{"nums":[2,1,3]}', source: 'Diagnostic' },
];
