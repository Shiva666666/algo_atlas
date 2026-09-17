import type { VisualizerAdapter } from '../../core/types';
import { nQueensCode } from './reference';
import { parseInput, createNQueensFrames } from './trace';
import type { NQueensData } from './types';
import { lessonPresets } from './presets';
export const nQueensVisualizer: VisualizerAdapter<unknown, NQueensData> = {
  id: 'lintcode-33-n-queens',
  name: 'One queen per row',
  mode: 'specialized',
  description:
    'Test a square, check its attacks, place a queen, and undo the choice after recursion returns.',
  inputLabel: 'Board size',
  inputGuide: 'Use {"n":4}; n must be 1–5. The complete search is shown.',
  placeholder: '{"n":4}',
  referenceCode: nQueensCode,
  presets: lessonPresets,
  parseInput,
  createFrames: createNQueensFrames,
};
export * from './trace';
