import type { VisualizerAdapter } from '../../core/types';
import type { SquaresData } from './types';
import { referenceCode, createFrames, parseInput } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, SquaresData> = {
  id: 'distinct-squares-segment-tree',
  name: 'Distinct Squares / Lazy Segment Tree Studio',
  mode: 'specialized',
  description: 'Connect changed subarray starts to squared-sum updates and deferred lazy tags.',
  inputLabel: 'Distinct squares input',
  inputGuide: '1–12 integers in 1…100,000. Complete trace limit: 12,000 steps.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
