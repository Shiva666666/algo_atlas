import type { VisualizerAdapter } from '../../core/types';
import { findCityPresets } from './presets';
import { createFindCityFrames, findCityCode, parseFindCityInput } from './trace';
import type { FindCityData } from './types';
export const findCityVisualizer: VisualizerAdapter<unknown, FindCityData> = {
  id: 'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance',
  name: 'Find the City',
  mode: 'specialized',
  presentation: 'diagram-first',
  description:
    'Connect each Floyd–Warshall matrix relaxation to the weighted graph and final threshold ranking.',
  inputLabel: 'Weighted city graph',
  inputGuide: 'Use 2–7 cities, simple undirected weighted edges, and a nonnegative threshold.',
  placeholder: '{"n":4,"edges":[[0,1,3]],"distanceThreshold":4}',
  referenceCode: findCityCode,
  parseInput: parseFindCityInput,
  createFrames: createFindCityFrames,
  presets: findCityPresets,
};
export * from './trace';
