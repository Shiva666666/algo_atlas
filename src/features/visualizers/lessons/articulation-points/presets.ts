import type { VisualPreset } from '../../core/types';

import { presets } from './trace';
export const lessonPresets: VisualPreset[] = presets(
  [
    ['Screenshot', '{"V":5,"edges":[[0,1],[1,4],[4,3],[4,2],[2,3]]}'],
    ['Triangle', '{"V":3,"edges":[[0,1],[1,2],[2,0]]}'],
  ],
  'HackerRank',
);
