export interface NQueensData {
  n: number;
  row: number;
  board: number[];
  columns: number[];
  differences: number[];
  sums: number[];
  candidate: { row: number; column: number; conflicts: number[] } | null;
  solutions: number[][];
  action:
    | 'start'
    | 'call'
    | 'check'
    | 'reject'
    | 'place'
    | 'undo'
    | 'solution'
    | 'return'
    | 'complete';
}
