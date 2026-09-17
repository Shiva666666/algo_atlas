import type { IntuitionFrameData, VisualizerAdapter } from '../../core/types';
import { referenceCode, parseInput, createParenthesesFrames } from './trace';

import { lessonPresets } from './presets';
export const generateParenthesesVisualizer: VisualizerAdapter<unknown, IntuitionFrameData> = {
  id: 'generate-parentheses',
  name: 'Balanced-prefix recursion',
  mode: 'specialized',
  description: 'Build balanced prefixes and record every complete parenthesis string.',
  inputLabel: 'RECURSION PARAMETER · n',
  placeholder: '{"n":3}',
  presets: lessonPresets,
  parseInput,
  createFrames: createParenthesesFrames,
  referenceCode,
};
export * from './trace';
