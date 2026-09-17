import { searchSuggestionsCode } from './reference';
import type { TrieSuggestionsFrameData } from './types';
import type { VisualizerAdapter } from '../../core/types';
import { WHY_I_MISSED_IT, parseInput, createSearchSuggestionsFrames } from './trace';

import { lessonPresets } from './presets';
export const searchSuggestionsVisualizer: VisualizerAdapter<unknown, TrieSuggestionsFrameData> = {
  id: 'search-suggestions-system',
  name: 'Trie prefix → three suggestions',
  mode: 'specialized',
  description:
    'Build a shared trie, walk each typed prefix, then collect terminal products in sorted depth-first order.',
  inputLabel: 'TRIE PARAMETERS · products, searchWord',
  inputGuide:
    'Use lowercase unique products. The teaching trace accepts up to 8 products, 16 characters per product, and 96 total product characters.',
  placeholder:
    '{"products":["mobile","mouse","moneypot","monitor","mousepad"],"searchWord":"mouse"}',
  referenceCode: searchSuggestionsCode,
  mistakeExplanation: WHY_I_MISSED_IT,
  presets: lessonPresets,
  parseInput,
  createFrames: createSearchSuggestionsFrames,
  presentation: 'diagram-first',
};
export * from './trace';
