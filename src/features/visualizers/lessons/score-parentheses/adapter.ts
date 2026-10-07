import type { VisualizerAdapter } from '../../core/types';
import type { ScoreData } from './types';
import { referenceCode, parseInput, createFrames } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, ScoreData> = {
  id: 'score-of-parentheses',
  name: 'Score of Parentheses',
  mode: 'specialized',
  description: 'Watch each primitive () leaf contribute 2 raised to its enclosing depth.',
  inputLabel: 'Depth Contribution Studio input',
  inputGuide: '2–32 balanced parentheses.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
export * from './trace';
