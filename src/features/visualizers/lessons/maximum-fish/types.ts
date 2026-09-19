import type { TraversalLessonData } from '../../core/traversal';
export type Cell = [number, number];
export interface MaximumFishInput {
  grid: number[][];
}
export interface MaximumFishData extends TraversalLessonData {
  inputGrid: number[][];
  seen: string[];
  stack: Cell[];
  current: Cell | null;
  subtotal: number;
  pondTotals: number[];
  result: number | null;
  action: string;
}
