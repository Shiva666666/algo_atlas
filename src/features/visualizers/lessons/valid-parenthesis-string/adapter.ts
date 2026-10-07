import type { VisualizerAdapter } from '../../core/types';
import type { WildcardData } from './types';
import { referenceCode, parseInput, createFrames } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, WildcardData> = {
  id: 'valid-parenthesis-string',
  name: 'Valid Parenthesis String',
  mode: 'specialized',
  description:
    'Track opening and star indexes separately, then test whether remaining stars occur late enough to close openings.',
  inputLabel: 'Wildcard Resource Workbench input',
  inputGuide: '1–32 characters: ( ) and *.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
export * from './trace';
