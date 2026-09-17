export interface RemoveKDigitsInput {
  num: string;
  k: number;
}
export type DigitPhase = 'scan' | 'tail' | 'build' | 'trim';
export type DigitAction =
  | 'guard'
  | 'early-return'
  | 'initialize'
  | 'read'
  | 'compare'
  | 'pop'
  | 'spend'
  | 'push'
  | 'output-init'
  | 'tail-check'
  | 'append-output'
  | 'trim-init'
  | 'trim-guard'
  | 'trim-check'
  | 'trim-step'
  | 'result';
export interface RemoveKDigitsData {
  num: string;
  originalK: number;
  remainingK: number;
  scanIndex: number | null;
  currentDigit: string | null;
  stack: number[];
  topIndex: number | null;
  removed: Array<{ index: number; reason: 'larger predecessor' | 'leftover tail' }>;
  condition: {
    stackPresent: boolean | null;
    greater: boolean | null;
    budgetAvailable: boolean | null;
    passes: boolean;
  } | null;
  phase: DigitPhase;
  action: DigitAction;
  rawOutput: string;
  outputIndex: number | null;
  trimIndex: number | null;
  result: string | null;
  earlyReturn: boolean;
  pendingSpend: boolean;
}
