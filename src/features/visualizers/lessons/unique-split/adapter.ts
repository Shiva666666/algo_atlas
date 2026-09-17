import { uniqueSplitCode } from './reference';
import type { UniqueSplitFrameData } from './types';
import type { VisualizerAdapter } from '../../core/types';
import { parseInput, createUniqueSplitFrames } from './trace';

import { lessonPresets } from './presets';
export const uniqueSplitVisualizer: VisualizerAdapter<unknown, UniqueSplitFrameData> = {
  id: 'split-a-string-into-the-max-number-of-unique-substrings',
  name: 'Unique substring backtracking',
  mode: 'specialized',
  description:
    'Choose a substring, reject repeats, recurse from its end, then restore the set for the next branch.',
  inputLabel: 'BACKTRACKING PARAMETER · s',
  inputGuide: 'Use a lowercase string of length 1–10 for a complete, readable recursion trace.',
  placeholder: '{"s":"ababccc"}',
  referenceCode: uniqueSplitCode,
  presets: lessonPresets,
  parseInput,
  createFrames: createUniqueSplitFrames,
  presentation: 'diagram-first',
};
export * from './trace';
