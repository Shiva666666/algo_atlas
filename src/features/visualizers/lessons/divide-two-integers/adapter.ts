import type { VisualizerAdapter } from '../../core/types';
import type { DivisionData } from './types';
import { referenceCode, parseInput, createFrames } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, DivisionData> = {
  id: 'divide-two-integers',
  name: 'Divide Two Integers / Shift-and-Subtract Studio',
  mode: 'specialized',
  description:
    'Compare shifted chunks, subtract those that fit, write quotient bits, then restore the sign.',
  inputLabel: 'Division input',
  inputGuide:
    'Signed 32-bit dividend and nonzero divisor. Every source shift from 31 through 0 is retained.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
