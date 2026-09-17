import type { VisualizerAdapter } from '../../core/types';
import { maxAreaIslandCode, parseIslandInput, createIslandFrames } from './trace';
import type { IslandData } from './types';
import { lessonPresets } from './presets';
export const maxAreaIslandVisualizer: VisualizerAdapter<unknown, IslandData> = {
  id: 'max-area-of-island',
  name: 'DFS Island Explorer',
  mode: 'specialized',
  presentation: 'diagram-first',
  inputEditor: 'island-grid',
  description: 'Follow each DFS call, add its returned area, and compare completed islands.',
  inputLabel: 'Land and water grid',
  inputGuide:
    'Use a rectangular grid of numeric 0 and 1: 1–10 rows, 1–13 columns. Saved Python is never executed.',
  placeholder: '{"grid":[[1,1,0],[0,1,0],[1,0,1]]}',
  referenceCode: maxAreaIslandCode,
  parseInput: parseIslandInput,
  createFrames: createIslandFrames,
  presets: lessonPresets,
};
export * from './trace';
