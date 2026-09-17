import type { GenericFrameData } from '../../core/types';
export interface LessonValue {
  variant: 'vertices';
  n: number;
  edges: number[][];
  idx?: number[];
  active?: number | number[];
  result?: number[];
  phase?: string;
}
export interface LessonFrameData extends Omit<GenericFrameData, 'value'> {
  value: LessonValue;
}
