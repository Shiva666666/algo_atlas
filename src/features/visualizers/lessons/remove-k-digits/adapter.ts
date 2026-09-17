import referenceCode from './reference.py?raw';
import type { VisualizerAdapter } from '../../core/types';
import { removeKDigitsCode, parseRemoveKDigitsInput, createRemoveKDigitsFrames } from './trace';
import type { RemoveKDigitsData } from './types';
import { lessonPresets } from './presets';
export const removeKDigitsVisualizer: VisualizerAdapter<unknown, RemoveKDigitsData> = {
  id: 'remove-k-digits',
  name: 'Greedy Stack Studio',
  mode: 'specialized',
  presentation: 'diagram-first',
  inputEditor: 'digit-string',
  description:
    'Choose each removal with an index stack, finish the budget, then trim leading zeros.',
  inputLabel: 'Number and removal budget',
  inputGuide:
    'Use a string of 1–32 digits without leading zeros (except "0"), and an integer k from 1 to its length.',
  placeholder: '{"num":"1432219","k":3}',
  referenceCode: removeKDigitsCode,
  presets: lessonPresets,
  parseInput: parseRemoveKDigitsInput,
  createFrames: createRemoveKDigitsFrames,
};
export * from './trace';
