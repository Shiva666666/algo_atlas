export interface WiggleData {
  original: number[];
  nums: number[];
  sorted: Array<{ value: number; id: number }>;
  i: number;
  j: number;
  z: number;
  written: number[];
  transfer: { source: number; destination: number; kind: 'valley' | 'peak' } | null;
  result: number[] | null;
  action: string;
  equation: string;
}
