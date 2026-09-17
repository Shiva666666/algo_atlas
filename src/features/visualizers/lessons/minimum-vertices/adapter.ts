import type { LessonFrameData, LessonValue } from './types';

import type { VisualizerAdapter } from '../../core/types';
import { V, p, vertexFrames, presets } from './trace';
import { lessonPresets } from './presets';
export const verticesVisualizer: VisualizerAdapter<unknown, LessonFrameData> = {
  id: 'minimum-number-of-vertices-to-reach-all-nodes',
  name: 'Zero-indegree sources',
  mode: 'specialized',
  description: 'Count incoming edges, then return every zero-indegree vertex.',
  inputLabel: 'DAG',
  placeholder: '{"n":6,"edges":[[0,1],[0,2],[2,5],[3,4],[4,2]]}',
  referenceCode: V,
  presets: lessonPresets,
  parseInput: p,
  createFrames: vertexFrames,
  presentation: 'diagram-first',
};
export * from './trace';
