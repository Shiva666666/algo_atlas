import type { VisualizerAdapter } from '../../core/types';
import { maximumFishPresets } from './presets';
import { createMaximumFishFrames, maximumFishCode, parseMaximumFishInput } from './trace';
import type { MaximumFishData } from './types';
export const maximumFishVisualizer: VisualizerAdapter<unknown, MaximumFishData> = {
  id: 'maximum-number-of-fish-in-a-grid',
  name: 'Maximum Fish',
  mode: 'specialized',
  presentation: 'diagram-first',
  description:
    'Watch weighted DFS calls return component subtotals before the global maximum changes.',
  inputLabel: 'Fish grid',
  inputGuide: 'Use a rectangular nonnegative integer grid up to 10×10.',
  placeholder: '{"grid":[[0,2],[4,0]]}',
  referenceCode: maximumFishCode,
  parseInput: parseMaximumFishInput,
  createFrames: createMaximumFishFrames,
  presets: maximumFishPresets,
};
export * from './trace';
