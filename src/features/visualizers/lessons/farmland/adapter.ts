import type { VisualizerAdapter } from '../../core/types';
import { farmlandPresets } from './presets';
import { createFarmlandFrames, farmlandCode, parseFarmlandInput } from './trace';
import type { FarmlandData } from './types';
export const farmlandVisualizer: VisualizerAdapter<unknown, FarmlandData> = {
  id: 'find-all-groups-of-farmland',
  name: 'Farmland Rectangle Finder',
  mode: 'specialized',
  presentation: 'diagram-first',
  description: 'Separate the row-major scan from BFS and watch each rectangular bound grow.',
  inputLabel: 'Binary farmland grid',
  inputGuide: 'Use a rectangular 0/1 grid up to 8×10. Every connected group must fill a rectangle.',
  placeholder: '{"land":[[1,0,0],[0,1,1],[0,1,1]]}',
  referenceCode: farmlandCode,
  parseInput: parseFarmlandInput,
  createFrames: createFarmlandFrames,
  presets: farmlandPresets,
  mistakeExplanation: [
    'The BFS marked the original seed repeatedly instead of the popped cell.',
    'Bottom-right is the independent maximum row and maximum column; rectangles need not be square.',
  ],
};
export * from './trace';
