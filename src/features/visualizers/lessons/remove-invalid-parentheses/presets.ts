import type { VisualPreset } from '../../core/types';
export const presets: VisualPreset[] = [
  { label: '()())() · two unique answers', input: '{"s":"()())()"}', source: 'LeetCode' },
  { label: '(a)())() · keep letters', input: '{"s":"(a)())()"}', source: 'LeetCode' },
  { label: ')( · empty answer', input: '{"s":")("}', source: 'LeetCode' },
  { label: '(()) · zero removals', input: '{"s":"(())"}', source: 'Diagnostic' },
  { label: 'abc · letters only', input: '{"s":"abc"}', source: 'Diagnostic' },
  { label: '())( · prefix rejection', input: '{"s":"())("}', source: 'Diagnostic' },
  { label: '((( · duplicate answers', input: '{"s":"((("}', source: 'Diagnostic' },
];
