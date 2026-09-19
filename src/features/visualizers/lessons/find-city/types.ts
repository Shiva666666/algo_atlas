import type { TraversalLessonData } from '../../core/traversal';
export interface FindCityInput {
  n: number;
  edges: number[][];
  distanceThreshold: number;
}
export interface FindCityData extends TraversalLessonData {
  n: number;
  edges: number[][];
  distance: Array<Array<number | null>>;
  middle: number | null;
  active: [number, number, number] | null;
  counts: Array<number | null>;
  answer: number | null;
  action: string;
}
