export interface DepthInput {
  s: string;
}
export interface DepthData {
  s: string;
  i: number;
  localDepth: number;
  maximum: number;
  action: string;
  equation: string;
  result: number | null;
  ranges: Array<{ start: number; end: number; level: number }>;
}
