import type { VisualizerAdapter } from '../../core/types';
import type { MinimumAddData } from './types';
import { referenceCode, parseInput, createFrames } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, MinimumAddData> = {
  id: 'minimum-add-to-make-parentheses-valid',
  name: 'Minimum Add to Make Parentheses Valid',
  mode: 'specialized',
  description:
    'Count missing openings during the scan, then add the unmatched openings remaining on the stack.',
  inputLabel: 'Parenthesis Repair Ledger input',
  inputGuide: '1–32 characters: ( and ).',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
export * from './trace';
