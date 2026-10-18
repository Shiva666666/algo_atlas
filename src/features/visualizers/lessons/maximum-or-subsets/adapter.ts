import type { VisualizerAdapter } from '../../core/types';
import type { OrData } from './types';
import { referenceCode, createFrames, parseInput } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, OrData> = {
  id: 'maximum-or-subsets',
  name: 'Maximum OR / Memoized Choice Studio',
  mode: 'specialized',
  description: 'Explore indexed take/skip choices, bit unions, and reusable continuation counts.',
  inputLabel: 'Maximum OR input',
  inputGuide: '1–8 integers in 1…100,000. Zero is outside the source problem domain.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
