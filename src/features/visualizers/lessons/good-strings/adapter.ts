import type { VisualizerAdapter } from '../../core/types';
import type { GoodStringsData } from './types';
import { goodStringsPresets } from './presets';
import { goodStringsCode, parseGoodStringsInput, createGoodStringsFrames } from './trace';
export const goodStringsVisualizer: VisualizerAdapter<unknown, GoodStringsData> = {
  id: 'count-ways-to-build-good-strings',
  name: 'Count Ways To Build Good Strings',
  mode: 'specialized',
  description:
    'Count stopping and both block choices, following the supplied memoized length recursion.',
  inputLabel: 'Length interval and block sizes',
  inputGuide: 'Teaching limits: 1 ≤ low ≤ high ≤ 24; 1 ≤ zero, one ≤ low.',
  placeholder: '{"low":3,"high":3,"zero":1,"one":1}',
  referenceCode: goodStringsCode,
  presets: goodStringsPresets,
  parseInput: parseGoodStringsInput,
  createFrames: createGoodStringsFrames,
};
export * from './trace';
