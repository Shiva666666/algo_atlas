import type { GenericFrameData } from '../../core/types';
export interface LessonValue {
  variant: 'articulation';
  V?: number;
  edges?: number[][];
  seen?: number[];
  disc?: number[];
  low?: number[];
  stack?: number[];
  active?: number[];
  result?: number[];
}
export interface LessonFrameData extends Omit<GenericFrameData, 'value'> {
  value: LessonValue;
}
