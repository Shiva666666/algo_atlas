export interface WeightedWordMappingInput {
  words: string[];
  weights: number[];
}
export type WeightedWordMappingAction =
  | 'start'
  | 'word-start'
  | 'lookup'
  | 'add'
  | 'store-total'
  | 'modulo'
  | 'map'
  | 'append'
  | 'complete';
export interface WeightedWordFrameData {
  words: string[];
  weights: number[];
  wordIndex: number | null;
  word: string | null;
  charIndex: number | null;
  character: string | null;
  alphabetIndex: number | null;
  selectedWeight: number | null;
  runningTotal: number;
  previousTotal: number | null;
  newTotal: number | null;
  totals: number[];
  modulo: number | null;
  mappedCharacter: string | null;
  output: string;
  action: WeightedWordMappingAction;
}
