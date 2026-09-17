import type { VisualPreset } from '../../core/types';

import { presets } from './trace';
export const lessonPresets: VisualPreset[] = presets(
  [
    ['Default', '{"n":6,"edges":[[0,1],[0,2],[2,5],[3,4],[4,2]]}'],
    ['Chain', '{"n":4,"edges":[[0,1],[1,2],[2,3]]}'],
  ],
  'LeetCode',
);
