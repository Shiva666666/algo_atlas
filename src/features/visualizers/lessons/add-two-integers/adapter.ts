import type { VisualizerAdapter } from '../../core/types';
import type { AdditionData } from './types';
import { referenceCode, parseInput, createFrames } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, AdditionData> = {
  id: 'add-two-integers',
  name: 'Add Two Integers / 32-Bit Carry Workbench',
  mode: 'specialized',
  description:
    'Read two bits, compute the sum bit, carry to the next column, then interpret the completed 32-bit result.',
  inputLabel: 'Bit addition input',
  inputGuide:
    'num1 and num2: integers from −100 through 100. All 32 source iterations are retained.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
