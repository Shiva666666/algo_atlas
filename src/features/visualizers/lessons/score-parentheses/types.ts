export interface ScoreData {
  s: string;
  index: number;
  depth: number;
  total: number;
  contributions: Array<{ index: number; depth: number; value: number }>;
  result: number | null;
  action: string;
  equation: string;
}
