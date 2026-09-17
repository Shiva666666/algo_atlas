import type { IntuitionFrameData, VisualizerAdapter } from '../../core/types';
import { referenceCode, parseInput, createFrames } from './trace';

import { lessonPresets } from './presets';
export const maximalSquareVisualizer: VisualizerAdapter<unknown, IntuitionFrameData> = {
  id: 'maximal-square',
  name: 'Bottom-right corner DP',
  mode: 'specialized',
  description:
    'Trace border initialization and the three-neighbor recurrence that grows each all-1 square.',
  inputLabel: 'BINARY MATRIX · matrix',
  placeholder: '{"matrix":[["1","0","1"],["1","1","1"],["1","1","1"]]}',
  referenceCode,
  presets: lessonPresets,
  parseInput,
  createFrames,
};
export * from './trace';
