import type { VisualizerAdapter } from '../../core/types';
import { repeatedSubstringCode, parseRepeatedInput, createRepeatedFrames } from './trace';
import type { RepeatedData } from './types';
import { lessonPresets } from './presets';
export const repeatedSubstringVisualizer: VisualizerAdapter<unknown, RepeatedData> = {
  id: 'repeated-substring-pattern',
  name: 'Prefix Tiling Studio',
  mode: 'specialized',
  presentation: 'diagram-first',
  inputEditor: 'prefix-string',
  description:
    'Test a proper prefix, tile the whole string, and see exactly where a candidate matches or fails.',
  inputLabel: 'String to test',
  inputGuide:
    'Use 1–32 lowercase ASCII letters. Character highlights explain string equality; saved Python is never executed.',
  placeholder: '{"s":"abab"}',
  referenceCode: repeatedSubstringCode,
  parseInput: parseRepeatedInput,
  createFrames: createRepeatedFrames,
  presets: lessonPresets,
};
export * from './trace';
