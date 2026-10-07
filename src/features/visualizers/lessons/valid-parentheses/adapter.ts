import type { VisualizerAdapter } from '../../core/types';
import type { ParenthesesData } from './types';
import { referenceCode, parseInput, createFrames } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, ParenthesesData> = {
  id: 'valid-parentheses',
  name: 'Valid Parentheses',
  mode: 'specialized',
  description:
    'Match each closer with the latest unmatched opening, preserving bracket type and order.',
  inputLabel: 'Bracket Matching Studio input',
  inputGuide: '1–32 characters: ( ) { } [ ].',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
export * from './trace';
