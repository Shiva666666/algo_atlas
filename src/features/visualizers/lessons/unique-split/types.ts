export interface UniqueSplitCallView {
  start: number;
  answer: number;
}

export interface UniqueSplitFrameData {
  s: string;
  start: number;
  end: number | null;
  candidate: string | null;
  candidateRange: [number, number] | null;
  path: string[];
  seen: string[];
  best: number;
  callStack: UniqueSplitCallView[];
  childResult: number | null;
  action: 'start' | 'candidate' | 'reject' | 'choose' | 'base' | 'return' | 'remove' | 'complete';
}

export interface UniqueSplitInput {
  s: string;
}
