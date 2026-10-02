export interface TriangleInput {
  triangle: number[][];
}
export interface TriangleData {
  triangle: number[][];
  dp: Array<Array<number | null>>;
  active: [number, number] | null;
  parents: Array<[number, number]>;
  action: string;
  equation: string;
  result: number | null;
  path: Array<[number, number]>;
}
