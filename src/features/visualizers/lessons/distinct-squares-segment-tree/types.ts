export interface TreeNode {
  i: number;
  l: number;
  r: number;
}
export interface TreeCall extends TreeNode {
  id: number;
  fn: 'update' | 'push' | 'apply';
  val: number;
}
export interface ApplyLedger extends TreeNode {
  val: number;
  length: number;
  oldSum: number;
  oldSquare: number;
  oldLazy: number;
}
export interface SquaresData {
  action: string;
  equation: string;
  nums: number[];
  right: number;
  num: number | null;
  prev: number | null;
  range: [number, number] | null;
  last: Record<string, number>;
  sum: number[];
  square: number[];
  lazy: number[];
  nodes: TreeNode[];
  calls: TreeCall[];
  active: number | null;
  coverage: 'none' | 'full' | 'partial' | null;
  operation: ApplyLedger | null;
  transfer: { parent: number; child: number | null; val: number } | null;
  committed: number[];
  committedRight: number;
  preview: number[] | null;
  res: number;
  result: number | null;
  updating: boolean;
  contributions: Array<{ right: number; value: number; total: number }>;
}
