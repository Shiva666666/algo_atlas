import type { VisualizerAdapter } from '../../core/types';
import { nearestExitPresets } from './presets';
import { createNearestExitFrames, nearestExitCode, parseNearestExitInput } from './trace';
import type { NearestExitData } from './types';
export const nearestExitVisualizer: VisualizerAdapter<unknown, NearestExitData> = {
  id: 'nearest-exit-from-entrance-in-maze',
  name: 'Nearest Exit BFS',
  mode: 'specialized',
  presentation: 'diagram-first',
  description: 'Watch a BFS wave discover the first valid border exit.',
  inputLabel: 'Maze and entrance',
  inputGuide:
    'Use a rectangular maze up to 8×10 with + walls, . openings, and an open entrance coordinate.',
  placeholder: '{"maze":["++.+","...+","+++."],"entrance":[1,2]}',
  referenceCode: nearestExitCode,
  parseInput: parseNearestExitInput,
  createFrames: createNearestExitFrames,
  presets: nearestExitPresets,
};
export * from './trace';
