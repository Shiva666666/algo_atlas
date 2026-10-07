export interface MinimumAddData {
  s: string;
  index: number;
  stack: Array<{ index: number; value: string }>;
  count: number;
  missingOpen: number;
  missingClose: number | null;
  result: number | null;
  action: string;
  equation: string;
}
