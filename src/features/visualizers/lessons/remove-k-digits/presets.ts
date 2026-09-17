import type { VisualPreset } from '../../core/types';

import { examples } from './trace';
export const lessonPresets: VisualPreset[] = examples.map(([num, k, label, source]) => ({
  label,
  source,
  input: JSON.stringify({ num, k }),
}));
