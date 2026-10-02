import type { MemoCallSnapshot } from '../../core/memoized-recursion-types';
export interface SquaresInput {
  n: number;
}
export interface SquaresData {
  n: number;
  squares: number[];
  memo: Array<number | null>;
  calls: MemoCallSnapshot[];
  action: string;
  equation: string;
  result: number | null;
  returned: number | null;
}
