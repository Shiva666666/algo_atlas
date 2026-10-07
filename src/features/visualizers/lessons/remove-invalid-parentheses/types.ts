export interface Token {
  index: number;
  value: string;
}
export interface RemovalCall {
  id: number;
  parentId: number | null;
  tokens: Token[];
  removes: number;
  ind: number;
  nextIndex: number | null;
}
export interface RemovalData {
  s: string;
  phase: 'budget' | 'search' | 'validation' | 'complete';
  action: string;
  equation: string;
  readIndex: number;
  minimum: number;
  sealed: boolean;
  countStack: Token[];
  tokens: Token[];
  calls: RemovalCall[];
  activeIndex: number | null;
  deletion: { originalIndex: number; currentIndex: number; nextString: string } | null;
  validation: 'not-run' | 'counts' | 'scanning' | 'invalid' | 'valid' | 'duplicate';
  validationReason: string;
  checkIndex: number;
  checkStack: Token[];
  openCount: number | null;
  closeCount: number | null;
  seen: string[];
  results: string[];
  result: string[] | null;
}
