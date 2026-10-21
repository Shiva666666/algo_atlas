import type { VisualizerAdapter } from '../../core/types';
import type { DecodeData } from './types';
import { referenceCode, parseInput, createFrames } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, DecodeData> = {
  id: 'decode-xored-array',
  name: 'Decode XORed Array / XOR Recovery Studio',
  mode: 'specialized',
  description:
    'Recover one value at a time: XOR the encoded value with the previous decoded value, then append.',
  inputLabel: 'XOR recovery input',
  inputGuide: '1–16 encoded values plus first, all integers from 0 through 100,000.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
