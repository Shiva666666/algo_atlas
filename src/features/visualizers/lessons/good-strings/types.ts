import type { MemoCallSnapshot } from '../../core/memoized-recursion-types';
export interface GoodStringsInput {
  low: number;
  high: number;
  zero: number;
  one: number;
}
export interface GoodStringsData extends GoodStringsInput {
  memo: Array<number | null>;
  calls: MemoCallSnapshot[];
  action: string;
  equation: string;
  result: number | null;
  returned: number | null;
}
