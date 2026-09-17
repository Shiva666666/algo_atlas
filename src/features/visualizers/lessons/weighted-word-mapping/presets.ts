import type { VisualPreset } from '../../core/types';

import { DEFAULT_WORDS, DEFAULT_WEIGHTS, UNIT_WEIGHTS } from './trace';
export const lessonPresets: VisualPreset[] = [
  {
    label: 'LeetCode example · rij',
    input: `{"words":${JSON.stringify(DEFAULT_WORDS)},"weights":${JSON.stringify(DEFAULT_WEIGHTS)}}`,
    source: 'LeetCode',
  },
  {
    label: 'Uniform weights · yyy',
    input: `{"words":["a","b","c"],"weights":${JSON.stringify(UNIT_WEIGHTS)}}`,
    source: 'LeetCode',
  },
  {
    label: 'Remainder zero · z',
    input: `{"words":["a"],"weights":[26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}`,
    source: 'Diagnostic',
  },
  {
    label: 'Remainder 25 · a',
    input: `{"words":["a"],"weights":[25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}`,
    source: 'Diagnostic',
  },
  {
    label: 'Repeated letters',
    input: `{"words":["aaaa","zz"],"weights":[2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3]}`,
    source: 'Diagnostic',
  },
];
