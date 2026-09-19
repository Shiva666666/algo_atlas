import type { VisualizerAdapter } from '../../core/types';
import { completeComponentsPresets } from './presets';
import {
  completeComponentsCode,
  createCompleteComponentsFrames,
  parseCompleteComponentsInput,
} from './trace';
import type { CompleteComponentsData } from './types';

export const completeComponentsVisualizer: VisualizerAdapter<unknown, CompleteComponentsData> = {
  id: 'count-the-number-of-complete-components',
  name: 'Component Completeness Audit',
  mode: 'specialized',
  presentation: 'diagram-first',
  description: 'Collect each connected component, freeze its size, and audit every vertex degree.',
  inputLabel: 'Undirected graph',
  inputGuide: 'Use n from 1–10 and unique, simple undirected edges.',
  placeholder: '{"n":6,"edges":[[0,1],[0,2],[1,2],[3,4]]}',
  referenceCode: completeComponentsCode,
  parseInput: parseCompleteComponentsInput,
  createFrames: createCompleteComponentsFrames,
  presets: completeComponentsPresets,
};
export * from './trace';
