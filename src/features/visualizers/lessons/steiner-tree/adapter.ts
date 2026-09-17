import { steinerCode } from './reference';
import type { SteinerFrameData } from './types';
import type { VisualizerAdapter } from '../../core/types';
import { parseSteinerInput, createFrames, official } from './trace';

import { lessonPresets } from './presets';
export const steinerTreeVisualizer: VisualizerAdapter<unknown, SteinerFrameData> = {
  id: 'abc395-g',
  name: 'Floyd–Warshall → Steiner DP studio',
  mode: 'specialized',
  description:
    'Build the all-pairs shortest-path matrix, then reuse it inside the exact terminal-mask DP and reconstruct the selected query tree.',
  inputLabel: 'ATCODER PARAMETERS · n, k, c, query',
  inputGuide:
    'Use {"n":5,"k":2,"c":[…],"query":[3,4]}. The matrix editor keeps costs symmetric and traces the selected query branch.',
  placeholder: official,
  referenceCode: steinerCode,
  inputEditor: 'steiner-matrix',
  presets: lessonPresets,
  parseInput: parseSteinerInput,
  createFrames,
  presentation: 'diagram-first',
};
export * from './trace';
