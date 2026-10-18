import type { VisualizerAdapter } from '../../core/types';
import type { DigitSumSwapData } from './types';
import { referenceCode, createFrames, parseInput } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, DigitSumSwapData> = {
  id: 'minimum-swaps-digit-sum',
  name: 'Digit-Sum Swap Studio',
  mode: 'specialized',
  description:
    'Build digit-sum keys, inspect a unique target, and trace each position-map update and minimum swap.',
  inputLabel: 'Digit-sum swap input',
  inputGuide: '1–12 distinct positive integers, at most 1,000,000,000 each.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
