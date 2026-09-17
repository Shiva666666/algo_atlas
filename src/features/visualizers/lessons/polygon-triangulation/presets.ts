import type { VisualPreset } from '../../core/types';

import { presets } from './trace';
export const lessonPresets: VisualPreset[] = presets(
  [
    ['Default', '{"values":[1,3,1,4,1,5]}'],
    ['Triangle', '{"values":[1,2,3]}'],
    ['Quadrilateral', '{"values":[3,7,4,5]}'],
    ['Equal weights', '{"values":[1,1,1,1]}'],
  ],
  'LeetCode',
);
