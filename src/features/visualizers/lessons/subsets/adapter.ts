import type { IntuitionFrameData, VisualizerAdapter } from '../../core/types';
import { parseInput, createFrames } from './trace';

import { lessonPresets } from './presets';
export const subsetsVisualizer: VisualizerAdapter<unknown, IntuitionFrameData> = {
  id: 'subsets-ii',
  name: 'Recursion level + sibling pruning',
  mode: 'specialized',
  description:
    'See why equal siblings are skipped while an equal value remains legal one recursion level deeper.',
  inputLabel: 'BACKTRACKING PARAMETER · nums',
  placeholder: '{"nums":[1,2,2]}',
  presets: lessonPresets,
  parseInput,
  createFrames,
};
export * from './trace';
