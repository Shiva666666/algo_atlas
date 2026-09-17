import type { LessonFrameData, LessonValue } from './types';

import type { VisualizerAdapter } from '../../core/types';
import { AP, p, apFrames, presets } from './trace';
import { lessonPresets } from './presets';
export const articulationVisualizer: VisualizerAdapter<unknown, LessonFrameData> = {
  id: 'articulation-point2616',
  name: 'DFS low-link articulation points',
  mode: 'specialized',
  description: 'See discovery, low links, and cut-vertex tests.',
  inputLabel: 'GRAPH',
  placeholder: '{"V":5,"edges":[[0,1],[1,4],[4,3],[4,2],[2,3]]}',
  referenceCode: AP,
  presets: lessonPresets,
  parseInput: p,
  createFrames: apFrames,
  presentation: 'diagram-first',
};
export * from './trace';
