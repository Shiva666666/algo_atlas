export interface ParenthesesData {
  s: string;
  index: number;
  stack: Array<{ index: number; value: string }>;
  matches: Array<{ open: number; close: number }>;
  comparison: {
    top: number | null;
    closer: string;
    expected: string | null;
    valid: boolean;
  } | null;
  result: boolean | null;
  action: string;
  equation: string;
}
