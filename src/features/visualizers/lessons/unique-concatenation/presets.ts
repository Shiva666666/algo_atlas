import type { VisualPreset } from '../../core/types';

import { presets } from './trace';
export const lessonPresets: VisualPreset[] = presets(
  [
    ['Default', '{"arr":["un","iq","ue"]}'],
    ['Greedy trap', '{"arr":["ab","cd","aef"]}'],
    ['Internal duplicates', '{"arr":["aa","bb"]}'],
    ['Duplicate items', '{"arr":["ab","ab","cd"]}'],
    ['Full alphabet', '{"arr":["abcdefghijklmnopqrstuvwxyz"]}'],
  ],
  'LeetCode',
);
