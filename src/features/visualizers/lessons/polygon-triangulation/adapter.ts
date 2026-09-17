import type { LessonFrameData, LessonValue } from './types';

import type { VisualizerAdapter } from '../../core/types';
import { T, p, triFrames, presets } from './trace';
import { lessonPresets } from './presets';
export const triangulationVisualizer: VisualizerAdapter<unknown, LessonFrameData> = {
  id: 'minimum-score-triangulation-of-polygon',
  name: 'Interval DP polygon splits',
  mode: 'specialized',
  description: 'Compare triangle costs, recursive intervals, and memo state.',
  inputLabel: 'POLYGON / values',
  placeholder: '{"values":[1,3,1,4,1,5]}',
  referenceCode: T,
  presets: lessonPresets,
  parseInput: p,
  createFrames: triFrames,
  presentation: 'diagram-first',
};
export * from './trace';
