export interface DivisionCheck {
  bit: number;
  candidate: string;
  before: number;
  oldRes: number;
  fits: boolean;
  state: 'rejected' | 'fits' | 'subtracted' | 'committed';
}
export interface DivisionData {
  originalDividend: number;
  originalDivisor: number;
  dividend: number;
  divisor: number;
  i: number | null;
  res: number | null;
  isNeg: boolean | null;
  overflow: boolean | null;
  dividendNegative: boolean | null;
  divisorNegative: boolean | null;
  checks: DivisionCheck[];
  current: DivisionCheck | null;
  result: number | null;
  action: string;
  equation: string;
}
