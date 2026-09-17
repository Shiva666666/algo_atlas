import type { Problem } from '../../../shared/contracts/index';

export interface VisualPreset {
  label: string;
  input: string;
  source: 'LeetCode' | 'LintCode' | 'AtCoder' | 'HackerRank' | 'Diagnostic' | 'Starter';
}

export interface VisualFrame<D = unknown> {
  phase: string;
  title: string;
  message: string;
  kind: string;
  data: D;
  codeFocus?: string[];
  /** Optional exact source lines for repeated expressions such as recursive returns. */
  codeLines?: number[];
  /** Checkpoints are shown in guided mode; transitions remain available on demand. */
  traceRole?: 'checkpoint' | 'transition';
}

export interface RuleFocus {
  token: string;
  meaning: string;
  active?: boolean;
}

export type GraphNodeRole =
  | 'terminal'
  | 'source'
  | 'target'
  | 'ordinary'
  | 'root'
  | 'frontier'
  | 'color-a'
  | 'color-b'
  | 'conflict';
export type GraphEdgeState = 'quiet' | 'active' | 'selected' | 'rejected';

export interface GraphNodeView {
  id: number;
  label: string;
  role: GraphNodeRole;
  detail?: string;
  x?: number;
  y?: number;
}

export interface GraphEdgeView {
  from: number;
  to: number;
  weight?: number;
  state: GraphEdgeState;
}

export interface InsightModel {
  state: string;
  base: string;
  choice: string;
  invariant: string;
}

export type IntuitionVariant =
  | 'binary-search'
  | 'graph-coloring'
  | 'grid-dp'
  | 'subset-pruning'
  | 'dual-heap'
  | 'tree-path'
  | 'parentheses';

export interface BinarySearchView {
  values: number[];
  low: number;
  high: number;
  mid: number | null;
  metricLabel: string;
  metric: number | null;
  verdict: string;
  answer: number | null;
  context: string;
}

export interface GraphColoringView {
  graph: { nodes: GraphNodeView[]; edges: GraphEdgeView[] };
  queue: number[];
  colors: Array<number | null>;
  activeNode: number | null;
  valid: boolean | null;
}

export interface GridDpView {
  grid: number[][];
  dp: Array<Array<number | null>>;
  storage?: 'rolling-row' | 'full-table';
  active: [number, number] | null;
  choices: Array<{ row: number; column: number; value: number }>;
  chosen: [number, number] | null;
}

export interface SubsetPruningView {
  values: number[];
  path: number[];
  level: number;
  candidates: Array<{ index: number; value: number; state: 'available' | 'chosen' | 'skipped' }>;
  resultCount: number;
  recorded?: number[][];
}

export interface ParenthesesView {
  n: number;
  partial: string;
  open: number;
  close: number;
  action: 'choose-open' | 'choose-close' | 'return' | 'record';
  results: string[];
}

export interface DualHeapView {
  capital: number;
  round: number;
  locked: Array<{ capital: number; profit: number }>;
  available: number[];
  selected: number | null;
}

export interface TreePathView {
  graph: { nodes: GraphNodeView[]; edges: GraphEdgeView[] };
  path: number[];
  activeNode: number | null;
  branchComparison: boolean;
}

export interface IntuitionFrameData {
  variant: IntuitionVariant;
  insights: InsightModel;
  rules: RuleFocus[];
  binarySearch?: BinarySearchView;
  graphColoring?: GraphColoringView;
  gridDp?: GridDpView;
  subsetPruning?: SubsetPruningView;
  parentheses?: ParenthesesView;
  dualHeap?: DualHeapView;
  treePath?: TreePathView;
}

export interface GenericFrameData {
  value: unknown;
  activePath: Array<string | number>;
  transitionIndex: number;
}

export interface VisualizerAdapter<I = unknown, D = unknown> {
  id: string;
  name: string;
  mode: 'specialized' | 'generic';
  description: string;
  inputLabel: string;
  placeholder: string;
  inputGuide?: string;
  referenceCode?: string;
  presets: VisualPreset[];
  parseInput: (raw: string) => I;
  createFrames: (input: I, problem: Problem) => VisualFrame<D>[];
  /** Redesigned lessons use the readable diagram-first workspace. */
  presentation?: 'diagram-first' | 'classic';
  /** Source-grounded reflection for the learner, when supplied by the user. */
  mistakeExplanation?: string[];
  /** Optional structured editor for adapters whose input has a matrix or other rich shape. */
  inputEditor?:
    | 'steiner-matrix'
    | 'weighted-word-grid'
    | 'matchsticks'
    | 'digit-string'
    | 'prefix-string'
    | 'island-grid';
}
