export interface FillInput {
  image: number[][];
  sr: number;
  sc: number;
  color: number;
}
export interface FillData extends FillInput {
  original: number[][];
  change: number;
  queue: Array<{ id: number; row: number; col: number }>;
  seen: Array<[number, number]>;
  active: { id: number; row: number; col: number } | null;
  candidate: [number, number] | null;
  direction: number | null;
  checks: Array<{ term: string; value: boolean | null }>;
  processed: number;
  changed: number;
  result: number[][] | null;
  action: string;
  equation: string;
}
