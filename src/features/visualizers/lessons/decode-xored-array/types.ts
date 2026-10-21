export interface DecodeData {
  encoded: number[];
  first: number;
  res: number[];
  index: number | null;
  num: number | null;
  real: number | null;
  board: { encoded: number; previous: number; result: number | null } | null;
  result: number[] | null;
  action: string;
  equation: string;
}
