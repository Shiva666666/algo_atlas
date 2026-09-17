import type { IntuitionFrameData, VisualizerAdapter } from '../../core/types';
import { parseInput, createFrames } from './trace';

import { lessonPresets } from './presets';
export const fallingPathVisualizer: VisualizerAdapter<unknown, IntuitionFrameData> = {
  id: 'minimum-falling-path-sum',
  name: 'Grid state + three child choices',
  mode: 'specialized',
  description:
    'Build the base row first, then watch each cell choose among valid downward pointers.',
  inputLabel: 'GRID PARAMETER · matrix',
  placeholder: '{"matrix":[[2,1,3],[6,5,4],[7,8,9]]}',
  presets: lessonPresets,
  parseInput,
  createFrames,
};
export * from './trace';
