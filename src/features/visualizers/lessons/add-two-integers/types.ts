export interface AdditionColumn {
  index: number;
  a: number | null;
  b: number | null;
  carryIn: number;
  sumBit: number | null;
  carryOut: number | null;
  oldRes: number;
}
export interface AdditionData {
  num1: number;
  num2: number;
  res: number | null;
  carry: number | null;
  i: number | null;
  a: number | null;
  b: number | null;
  sumBit: number | null;
  column: AdditionColumn | null;
  written: number;
  signSet: boolean | null;
  complement: number | null;
  result: number | null;
  action: string;
  equation: string;
}
