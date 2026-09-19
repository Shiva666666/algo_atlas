import type { TraversalLessonData } from '../../core/traversal';
export type Cell = [number, number];
export interface MinimumTimeInput {
  moveTime: number[][];
}
export interface HeapItem {
  time: number;
  row: number;
  column: number;
  serial: number;
}
export interface MinimumTimeData extends TraversalLessonData {
  moveTime: number[][];
  best: Array<Array<number | null>>;
  heap: HeapItem[];
  finalized: string[];
  current: Cell | null;
  candidate: Cell | null;
  wait: number;
  duration: number | null;
  result: number | null;
  action: string;
}
