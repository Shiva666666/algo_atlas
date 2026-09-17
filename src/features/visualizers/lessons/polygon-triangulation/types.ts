import type { GenericFrameData } from '../../core/types';
export interface LessonValue {
  variant: 'triangulation';
  values: number[];
  memo: Record<string, number>;
  interval?: number[];
  candidate?: number;
  state: 'start' | 'base' | 'memo' | 'best' | 'complete' | 'root';
}
export interface LessonFrameData extends Omit<GenericFrameData, 'value'> {
  value: LessonValue;
}
