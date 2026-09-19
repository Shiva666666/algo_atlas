import type { TraversalLessonData } from '../../core/traversal';
export type Cell = [number, number];
export interface FarmlandInput {
  land: number[][];
}
export interface FarmlandData extends TraversalLessonData {
  land: number[][];
  scan: Cell | null;
  queue: Cell[];
  seen: string[];
  current: Cell | null;
  bounds: [number, number, number, number] | null;
  groups: number[][];
  action: string;
  result: number[][] | null;
}
