export interface CoinCall {
  id: number;
  i: number;
  a: number;
  via: 'root' | 'take' | 'skip';
  take: number | null;
  skip: number | null;
}
export interface CoinChangeData {
  coins: number[];
  amount: number;
  stack: CoinCall[];
  memo: Array<Array<number | null>>;
  active: [number, number] | null;
  event: string;
  returnValue: number | null;
  result: number | null;
}
