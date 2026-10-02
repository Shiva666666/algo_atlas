import type { VisualizerAdapter } from '../../core/types';
import type { SquaresData } from './types';
import { squaresPresets } from './presets';
import { squaresCode, parseSquaresInput, createSquaresFrames } from './trace';
export const squaresVisualizer: VisualizerAdapter<unknown, SquaresData> = {
  id: 'perfect-squares',
  name: 'Perfect Squares',
  mode: 'specialized',
  description:
    'Follow each subtraction, child return and memo write in the supplied top-down solution.',
  inputLabel: 'Target n',
  inputGuide: 'Teaching range: integer n from 1 to 40; every recursive operation is retained.',
  placeholder: '{"n":12}',
  referenceCode: squaresCode,
  presets: squaresPresets,
  parseInput: parseSquaresInput,
  createFrames: createSquaresFrames,
};
export * from './trace';
