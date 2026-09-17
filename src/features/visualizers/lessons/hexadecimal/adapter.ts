import type { VisualizerAdapter } from '../../core/types';
import { hexadecimalCode } from './reference';
import { parseInput, createHexadecimalFrames } from './trace';
import type { HexadecimalData } from './types';
import { lessonPresets } from './presets';
export const hexadecimalVisualizer: VisualizerAdapter<unknown, HexadecimalData> = {
  id: 'convert-a-number-to-hexadecimal',
  name: 'Four bits become one digit',
  mode: 'specialized',
  description: 'Mask to 32 bits, read a nibble, prepend its hexadecimal digit, then shift.',
  inputLabel: 'Signed 32-bit integer',
  inputGuide:
    'Use {"num":26}. Supports zero, positive values, and negative two’s-complement values.',
  placeholder: '{"num":26}',
  referenceCode: hexadecimalCode,
  presets: lessonPresets,
  parseInput,
  createFrames: createHexadecimalFrames,
};
export * from './trace';
