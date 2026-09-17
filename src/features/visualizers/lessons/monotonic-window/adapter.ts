import type { MonotonicWindowFrameData } from './types';
import type { VisualizerAdapter } from '../../core/types';
import { parseInput, createFrames } from './trace';

import { lessonPresets } from './presets';
export const monotonicWindowVisualizer: VisualizerAdapter<unknown, MonotonicWindowFrameData> = {
  id: 'longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit',
  name: 'Window + two monotonic deques',
  mode: 'specialized',
  description:
    'See the window, increasing minimum deque, decreasing maximum deque, and every shrink decision stay synchronized.',
  inputLabel: 'WINDOW PARAMETERS · nums, limit',
  placeholder: '{"nums":[8,2,4,7],"limit":4}',
  presets: lessonPresets,
  parseInput,
  createFrames,
};
export * from './trace';
