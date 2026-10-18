export interface DigitHelper {
  inputIndex: number;
  value: number;
  remaining: number;
  total: number;
  digit: number | null;
  oldTotal: number;
  oldRemaining: number;
}
export interface MapWrite {
  value: number;
  before: number | null;
  after: number;
}
export interface SwapOperation {
  i: number;
  j: number;
  displaced: number;
  required: number;
  writes: MapWrite[];
  stage: 'located' | 'prepared-one' | 'prepared-both' | 'swapped' | 'counted';
}
export interface DigitSumSwapData {
  original: number[];
  nums: number[];
  keys: Array<number | null>;
  target: number[] | null;
  helper: DigitHelper | null;
  pos: Record<number, number> | null;
  i: number | null;
  j: number | null;
  count: number | null;
  confirmed: number;
  swap: SwapOperation | null;
  history: Array<{ i: number; j: number; displaced: number; required: number }>;
  result: number | null;
  action: string;
  equation: string;
}
