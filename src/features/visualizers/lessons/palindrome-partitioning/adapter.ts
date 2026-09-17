import type { PalindromeFrameData } from './types';
import type { VisualizerAdapter } from '../../core/types';
import { parseInput, createFrames } from './trace';

import { lessonPresets } from './presets';
export const palindromePartitioningVisualizer: VisualizerAdapter<unknown, PalindromeFrameData> = {
  id: 'palindrome-partitioning-ii',
  name: 'Palindrome table + prefix cuts',
  mode: 'specialized',
  description:
    'Watch the triangular palindrome table fill first, then see each valid suffix update the one-dimensional prefix-cut state.',
  inputLabel: 'STRING PARAMETER · s',
  placeholder: 'aab\n\nor {"s":"cdd"}',
  presets: lessonPresets,
  parseInput,
  createFrames,
};
export * from './trace';
