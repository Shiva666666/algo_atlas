import type { VisualizerAdapter } from '../../core/types';
import { trianglePresets } from './presets';
import { triangleCode, parseTriangleInput, createTriangleFrames } from './trace';
import type { TriangleData } from './types';
export const triangleVisualizer: VisualizerAdapter<unknown, TriangleData> = {
  id: 'triangle',
  name: 'Triangle',
  mode: 'specialized',
  description:
    'Compare valid parents before storing the minimum cost of reaching each triangle cell.',
  inputLabel: 'Triangle rows',
  inputGuide: 'Use 1–8 rows with lengths 1, 2, …; integer values from −10,000 to 10,000.',
  placeholder: '{"triangle":[[2],[3,4]]}',
  referenceCode: triangleCode,
  presets: trianglePresets,
  parseInput: parseTriangleInput,
  createFrames: createTriangleFrames,
};
export * from './trace';
