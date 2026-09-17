import type { IncremovableFrameData } from './types';
import type { VisualizerAdapter } from '../../core/types';
import { incremovableCode } from './reference';
import { parseInput, createIncremovableFrames } from './trace';

import { lessonPresets } from './presets';
export const incremovableVisualizer: VisualizerAdapter<unknown, IncremovableFrameData> = {
  id: 'count-the-number-of-incremovable-subarrays-i',
  name: 'Increasing prefix + suffix two pointers',
  mode: 'specialized',
  description:
    'Follow the O(n) solution: join an increasing prefix and suffix, then count every valid removal boundary.',
  inputLabel: 'Positive integer array · nums',
  inputGuide: 'Use {"nums":[6,5,7,8]}; 1–18 positive safe integers.',
  placeholder: '{"nums":[6,5,7,8]}',
  referenceCode: incremovableCode,
  presets: lessonPresets,
  parseInput,
  createFrames: createIncremovableFrames,
};
export * from './trace';
