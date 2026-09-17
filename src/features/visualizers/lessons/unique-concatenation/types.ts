import type { GenericFrameData } from '../../core/types';
export interface LessonValue {
  variant: 'unique';
  arr: string[];
  word?: string;
  used?: string[];
  i?: number;
  best?: number;
  candidate?: number;
  unique?: boolean;
  disjoint?: boolean | null;
  result?: number;
}
export interface LessonFrameData extends Omit<GenericFrameData, 'value'> {
  value: LessonValue;
}
