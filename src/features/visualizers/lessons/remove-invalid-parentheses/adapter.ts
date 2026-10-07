import type { VisualizerAdapter } from '../../core/types';
import type { RemovalData } from './types';
import { referenceCode, createFrames, parseInput } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, RemovalData> = {
  id: 'remove-invalid-parentheses',
  name: 'Remove Invalid Parentheses',
  mode: 'specialized',
  description:
    'Minimal Removal Lab: count the minimum deletions, explore substring choices, validate leaf candidates, and collect unique answers.',
  inputLabel: 'Minimal Removal Lab input',
  inputGuide: '1–12 lowercase letters and parentheses. Complete trace limit: 12,000 steps.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
export * from './trace';
