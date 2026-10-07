import type { VisualizerAdapter } from '../../core/types';
import type { WiggleData } from './types';
import { referenceCode, parseInput, createFrames } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, WiggleData> = {
  id: 'wiggle-sort-ii',
  name: 'Wiggle Sort II',
  mode: 'specialized',
  description:
    'Separate the sorted halves and read both backwards to write alternating valleys and peaks.',
  inputLabel: 'Reverse-Half Interleaving Studio input',
  inputGuide: '1–12 integers, 0–5000. The input must admit a strict wiggle.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
export * from './trace';
