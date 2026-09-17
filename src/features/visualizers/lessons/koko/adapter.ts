import type { IntuitionFrameData, VisualizerAdapter } from '../../core/types';
import { parseKoko, kokoFrames } from './trace';

import { lessonPresets } from './presets';
export const kokoVisualizer: VisualizerAdapter<unknown, IntuitionFrameData> = {
  id: 'koko-eating-bananas',
  name: 'Binary search on the answer',
  mode: 'specialized',
  description: 'Watch the candidate speed interval shrink around the first feasible value.',
  inputLabel: 'FEASIBILITY PARAMETERS · piles, h',
  placeholder: '{"piles":[3,6,7,11],"h":8}',
  presets: lessonPresets,
  parseInput: parseKoko,
  createFrames: kokoFrames,
};
export * from './trace';
