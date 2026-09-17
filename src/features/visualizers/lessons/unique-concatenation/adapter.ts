import type { LessonFrameData, LessonValue } from './types';

import type { VisualizerAdapter } from '../../core/types';
import { U, p, uniqueFrames, presets } from './trace';
import { lessonPresets } from './presets';
export const uniqueVisualizer: VisualizerAdapter<unknown, LessonFrameData> = {
  id: 'maximum-length-of-a-concatenated-string-with-unique-characters',
  name: 'String-set backtracking',
  mode: 'specialized',
  description: 'Follow candidate compatibility and each call-local best.',
  inputLabel: 'BACKTRACKING / arr',
  placeholder: '{"arr":["un","iq","ue"]}',
  referenceCode: U,
  presets: lessonPresets,
  parseInput: p,
  createFrames: uniqueFrames,
  presentation: 'diagram-first',
};
export * from './trace';
