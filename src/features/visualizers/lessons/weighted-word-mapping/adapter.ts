import { weightedWordMappingCode } from './reference';
import type { VisualizerAdapter } from '../../core/types';
import {
  DEFAULT_WORDS,
  MAX_WORDS,
  MAX_WORD_LENGTH,
  MAX_TOTAL_CHARACTERS,
  parseWeightedWordMappingInput,
  createWeightedWordMappingFrames,
  DEFAULT_WEIGHTS,
} from './trace';
import type { WeightedWordFrameData } from './types';
import { lessonPresets } from './presets';
export const weightedWordMappingVisualizer: VisualizerAdapter<unknown, WeightedWordFrameData> = {
  id: 'weighted-word-mapping',
  name: 'Weighted words → reverse alphabet',
  mode: 'specialized',
  description:
    'Accumulate each word through the a–z weight table, reduce modulo 26, and decode against the reverse alphabet.',
  inputLabel: 'WORD MAPPING PARAMETERS · words and weights',
  inputGuide: `Use lowercase words and exactly 26 non-negative safe-integer weights. The readable trace accepts ${MAX_WORDS} words, ${MAX_WORD_LENGTH} characters per word, and ${MAX_TOTAL_CHARACTERS} total characters.`,
  placeholder: `{"words":${JSON.stringify(DEFAULT_WORDS)},"weights":${JSON.stringify(DEFAULT_WEIGHTS)}}`,
  referenceCode: weightedWordMappingCode,
  presets: lessonPresets,
  parseInput: parseWeightedWordMappingInput,
  createFrames: createWeightedWordMappingFrames,
  presentation: 'diagram-first',
  inputEditor: 'weighted-word-grid',
};
export * from './trace';
