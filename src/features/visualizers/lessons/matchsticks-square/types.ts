export interface MatchsticksInput {
  matchsticks: number[];
}
export type MatchstickSide = 'left' | 'right' | 'top' | 'down';
export type MatchsticksAction =
  | 'target'
  | 'divisibility'
  | 'sort'
  | 'reverse'
  | 'call'
  | 'base-success'
  | 'base-failure'
  | 'check'
  | 'prune'
  | 'explore'
  | 'resume'
  | 'return-failure'
  | 'return-success'
  | 'complete';
export type MatchstickChoiceState =
  | 'untried'
  | 'checking'
  | 'pruned'
  | 'exploring'
  | 'failed'
  | 'successful';
export interface MatchstickChoice {
  side: MatchstickSide;
  state: MatchstickChoiceState;
  candidateSum: number;
  fits: boolean | null;
}
export interface MatchstickCall {
  id: number;
  parentId: number | null;
  index: number;
  sums: Record<MatchstickSide, number>;
  activeSide: MatchstickSide | null;
  result: boolean | null;
}
export interface MatchsticksFrameData {
  original: number[];
  sorted: Array<{ id: number; value: number }>;
  target: number;
  total: number;
  index: number;
  currentStick: { id: number; value: number } | null;
  sideSums: Record<MatchstickSide, number>;
  sideSticks: Record<MatchstickSide, number[]>;
  stack: MatchstickCall[];
  callId: number | null;
  parentId: number | null;
  activeSide: MatchstickSide | null;
  candidateSum: number | null;
  choices: MatchstickChoice[];
  childResult: boolean | null;
  action: MatchsticksAction;
  result: boolean | null;
  messageKey: string;
}
