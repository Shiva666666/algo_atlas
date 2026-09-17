import type { IntuitionFrameData, VisualizerAdapter } from '../../core/types';
import { parseSpecial, specialFrames } from './trace';

import { lessonPresets } from './presets';
export const specialArrayVisualizer: VisualizerAdapter<unknown, IntuitionFrameData> = {
  id: 'special-array-with-x-elements-greater-than-or-equal-x',
  name: 'Binary search a candidate value',
  mode: 'specialized',
  description:
    'Separate the candidate answer x from array indices and verify the monotonic boundary.',
  inputLabel: 'COUNTING PARAMETERS · nums',
  placeholder: '{"nums":[3,5]}',
  presets: lessonPresets,
  parseInput: parseSpecial,
  createFrames: specialFrames,
};
export * from './trace';
