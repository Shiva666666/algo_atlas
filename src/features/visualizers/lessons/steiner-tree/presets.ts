import type { VisualPreset } from '../../core/types';

import { official, hiddenHub, indirect, trueSplit, zeroTies, large } from './trace';
export const lessonPresets: VisualPreset[] = [
  { label: 'Official sample · connector reuse', input: official, source: 'AtCoder' },
  { label: 'Hidden hub beats required-only MST', input: hiddenHub, source: 'Diagnostic' },
  { label: 'Indirect route beats direct edge', input: indirect, source: 'Diagnostic' },
  { label: 'True split at the query root', input: trueSplit, source: 'Diagnostic' },
  { label: 'Zero weights and tied optima', input: zeroTies, source: 'Diagnostic' },
  { label: '64-bit total cost', input: large, source: 'Diagnostic' },
];
