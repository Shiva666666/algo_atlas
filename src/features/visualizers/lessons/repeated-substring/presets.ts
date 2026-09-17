import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  'abab',
  'aba',
  'abcabcabcabc',
  'a',
  'aaaa',
  'ababac',
].map((s, i) => ({
  label: (i < 3 ? 'Official · ' : 'Diagnostic · ') + s,
  source: i < 3 ? 'LeetCode' : 'Diagnostic',
  input: JSON.stringify({ s }),
}));
