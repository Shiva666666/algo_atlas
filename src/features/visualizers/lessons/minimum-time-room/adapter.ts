import type { VisualizerAdapter } from '../../core/types';
import { minimumTimePresets } from './presets';
import { createMinimumTimeFrames, minimumTimeCode, parseMinimumTimeInput } from './trace';
import type { MinimumTimeData } from './types';
export const minimumTimeVisualizer: VisualizerAdapter<unknown, MinimumTimeData> = {
  id: 'minimum-time-to-reach-last-room-ii',
  name: 'Minimum Time to Reach Last Room II',
  mode: 'specialized',
  presentation: 'diagram-first',
  description:
    'Use a stable min-heap to separate gates, waiting, and alternating 1/2 movement durations.',
  inputLabel: 'Room opening times',
  inputGuide:
    'Use a rectangular nonnegative integer grid up to 8×8. The start room is occupied at time 0.',
  placeholder: '{"moveTime":[[0,4],[4,4]]}',
  referenceCode: minimumTimeCode,
  parseInput: parseMinimumTimeInput,
  createFrames: createMinimumTimeFrames,
  presets: minimumTimePresets,
  mistakeExplanation: [
    'A room gate is the earliest time a move into it may begin; duration is added afterward.',
    'Move duration alternates by move count, not direction, and the destination is final only when popped.',
  ],
};
export * from './trace';
