import type { VisualPreset } from '../../core/types';
export const presets: VisualPreset[] = [
  { label: 'Example 1 · 15', input: '{"nums":[1,2,1]}', source: 'LeetCode' },
  { label: 'Example 2 · 3', input: '{"nums":[2,2]}', source: 'LeetCode' },
  { label: 'Single value · 1', input: '{"nums":[1]}', source: 'Diagnostic' },
  { label: 'All equal · 6', input: '{"nums":[1,1,1]}', source: 'Diagnostic' },
  { label: 'All distinct · 50', input: '{"nums":[1,2,3,4]}', source: 'Diagnostic' },
  { label: 'Deferred tags · 158', input: '{"nums":[1,2,3,4,1,2]}', source: 'Diagnostic' },
];
