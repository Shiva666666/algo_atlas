import type { TraversalLessonData } from '../../core/traversal';
export type Cell = [number, number];
export interface NearestExitInput {
  maze: string[];
  entrance: Cell;
}
export interface NearestExitData extends TraversalLessonData {
  maze: string[];
  entrance: Cell;
  queue: Array<[number, number, number]>;
  seen: string[];
  current: Cell | null;
  candidate: Cell | null;
  distance: number | null;
  path: Cell[];
  action: string;
  result: number | null;
}
