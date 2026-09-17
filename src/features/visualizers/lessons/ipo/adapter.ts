import type { IntuitionFrameData, VisualizerAdapter } from '../../core/types';
import { parseInput, createFrames } from './trace';

import { lessonPresets } from './presets';
export const ipoVisualizer: VisualizerAdapter<unknown, IntuitionFrameData> = {
  id: 'ipo',
  name: 'Capital frontier + max-profit heap',
  mode: 'specialized',
  description:
    'Watch projects cross from the capital ordering into the profit ordering before each greedy choice.',
  inputLabel: 'GREEDY PARAMETERS · k, w, profits, capital',
  placeholder: '{"k":2,"w":0,"profits":[1,2,3],"capital":[0,1,1]}',
  presets: lessonPresets,
  parseInput,
  createFrames,
};
export * from './trace';
