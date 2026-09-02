import type {Problem} from '../types';

export interface VisualPreset {
  label:string;
  input:string;
  source:'LeetCode'|'LintCode'|'AtCoder'|'HackerRank'|'Diagnostic'|'Starter';
}

export interface VisualFrame {
  phase:string;
  title:string;
  message:string;
  kind:'palindrome-cuts'|'generic'|'steiner-tree'|'monotonic-window'|'incremovable'|'intuition'|'n-queens'|'coin-change'|'hexadecimal'|'trie-suggestions'|'unique-split'|'weighted-word-mapping';
  data:unknown;
  codeFocus?:string[];
  /** Checkpoints are shown in guided mode; transitions remain available on demand. */
  traceRole?:'checkpoint'|'transition';
}

export interface RuleFocus {
  token:string;
  meaning:string;
  active?:boolean;
}

export type GraphNodeRole='terminal'|'source'|'target'|'ordinary'|'root'|'frontier'|'color-a'|'color-b'|'conflict';
export type GraphEdgeState='quiet'|'active'|'selected'|'rejected';

export interface GraphNodeView {
  id:number;
  label:string;
  role:GraphNodeRole;
  detail?:string;
  x?:number;
  y?:number;
}

export interface GraphEdgeView {
  from:number;
  to:number;
  weight?:number;
  state:GraphEdgeState;
}

export interface InsightModel {
  state:string;
  base:string;
  choice:string;
  invariant:string;
}

export interface SteinerFrameData {
  stage:'floyd-warshall'|'steiner-dp';
  graph:{nodes:GraphNodeView[];edges:GraphEdgeView[]};
  expandedGraph?:{nodes:GraphNodeView[];edges:GraphEdgeView[]};
  fixed:number[];
  s:number;
  t:number;
  layer:'comparison'|'base'|'with-s'|'answer';
  transition:'overview'|'seed'|'merge'|'relax'|'query-seed'|'lookup'|'reconstruct'|'handoff';
  mask:number;
  maskWidth:number;
  maskTerminals:number[];
  submask:number|null;
  otherMask:number|null;
  root:number|null;
  target:number|null;
  dpRow:Array<number|null>;
  dpTable:Array<Array<number|null>>;
  oldDpRow:Array<number|null>|null;
  oldCost:number|null;
  candidateCost:number|null;
  newCost:number|null;
  answer:number|null;
  distanceMatrix:Array<Array<number|null>>;
  floyd?:{
    matrix:Array<Array<number|null>>;
    original:Array<Array<number|null>>;
    intermediate:number|null;
    current:[number,number]|null;
    oldDistance:number|null;
    viaDistance:number|null;
    newDistance:number|null;
    accepted:boolean|null;
    candidatePath:number[];
    completedIntermediates:number[];
    sealed:boolean;
  };
  comparison?:{naive:string;intended:string};
  insights:InsightModel;
  rules:RuleFocus[];
}

export interface MonotonicWindowFrameData {
  nums:number[];
  limit:number;
  left:number;
  right:number;
  minDeque:number[];
  maxDeque:number[];
  best:number;
  bestRange:[number,number]|null;
  activeIndex:number|null;
  valid:boolean|null;
  action:string;
  insights:InsightModel;
  rules:RuleFocus[];
}

export interface IncremovableFrameData {
  nums:number[];
  prefixEnd:number;
  suffixStart:number;
  suffixPointer?:number;
  comparison?:{left:number;right:number;kind:'prefix'|'bridge'|'suffix';valid:boolean};
  activeIndex:number|null;
  answer:number;
  added:number;
  bridgeValid:boolean|null;
  allIncreasing:boolean;
  action:string;
  insights:InsightModel;
  rules:RuleFocus[];
}

export type IntuitionVariant='binary-search'|'graph-coloring'|'grid-dp'|'subset-pruning'|'dual-heap'|'tree-path'|'parentheses';

export interface BinarySearchView {
  values:number[];
  low:number;
  high:number;
  mid:number|null;
  metricLabel:string;
  metric:number|null;
  verdict:string;
  answer:number|null;
  context:string;
}

export interface GraphColoringView {
  graph:{nodes:GraphNodeView[];edges:GraphEdgeView[]};
  queue:number[];
  colors:Array<number|null>;
  activeNode:number|null;
  valid:boolean|null;
}

export interface GridDpView {
  grid:number[][];
  dp:Array<Array<number|null>>;
  storage?:'rolling-row'|'full-table';
  active:[number,number]|null;
  choices:Array<{row:number;column:number;value:number}>;
  chosen:[number,number]|null;
}

export interface SubsetPruningView {
  values:number[];
  path:number[];
  level:number;
  candidates:Array<{index:number;value:number;state:'available'|'chosen'|'skipped'}>;
  resultCount:number;
  recorded?:number[][];
}

export interface ParenthesesView {
  n:number;
  partial:string;
  open:number;
  close:number;
  action:'choose-open'|'choose-close'|'return'|'record';
  results:string[];
}

export interface DualHeapView {
  capital:number;
  round:number;
  locked:Array<{capital:number;profit:number}>;
  available:number[];
  selected:number|null;
}

export interface TreePathView {
  graph:{nodes:GraphNodeView[];edges:GraphEdgeView[]};
  path:number[];
  activeNode:number|null;
  branchComparison:boolean;
}

export interface IntuitionFrameData {
  variant:IntuitionVariant;
  insights:InsightModel;
  rules:RuleFocus[];
  binarySearch?:BinarySearchView;
  graphColoring?:GraphColoringView;
  gridDp?:GridDpView;
  subsetPruning?:SubsetPruningView;
  parentheses?:ParenthesesView;
  dualHeap?:DualHeapView;
  treePath?:TreePathView;
}

export interface PalindromeFrameData {
  s:string;
  palindrome:Array<Array<boolean|null>>;
  cuts:Array<number|null>;
  activeStart:number|null;
  activeEnd:number|null;
  highlightStart:number|null;
  highlightEnd:number|null;
  accepted:boolean|null;
  candidate:number|null;
}

export interface GenericFrameData {
  value:unknown;
  activePath:Array<string|number>;
  transitionIndex:number;
}

export interface VisualizerAdapter {
  id:string;
  name:string;
  mode:'specialized'|'generic';
  description:string;
  inputLabel:string;
  placeholder:string;
  inputGuide?:string;
  referenceCode?:string;
  presets:VisualPreset[];
  parseInput:(raw:string)=>unknown;
  createFrames:(input:unknown,problem:Problem)=>VisualFrame[];
  /** Redesigned lessons use the readable diagram-first workspace. */
  presentation?:'diagram-first'|'classic';
  /** Source-grounded reflection for the learner, when supplied by the user. */
  mistakeExplanation?:string[];
  /** Optional structured editor for adapters whose input has a matrix or other rich shape. */
  inputEditor?:'steiner-matrix'|'weighted-word-grid';
}

export type TrieNodeState='idle'|'active'|'visited'|'terminal'|'missing';

export interface TrieNodeView {
  id:string;
  label:string;
  depth:number;
  parent:string|null;
  terminalProduct:string|null;
  state:TrieNodeState;
}

export interface TrieEdgeView {
  from:string;
  to:string;
  character:string;
  state:'idle'|'active'|'visited';
}

export interface TrieSuggestionsFrameData {
  products:string[];
  searchWord:string;
  nodes:TrieNodeView[];
  edges:TrieEdgeView[];
  currentPrefix:string;
  prefixIndex:number;
  traversalPath:string[];
  activeNode:string|null;
  activeCharacter:string|null;
  terminalProduct:string|null;
  suggestions:string[];
  resultLists:string[][];
  limit:3;
  action:'insert'|'ready'|'walk'|'missing'|'collect'|'suggestion'|'prefix-complete'|'complete';
}

export interface UniqueSplitCallView {
  start:number;
  answer:number;
}

export interface UniqueSplitFrameData {
  s:string;
  start:number;
  end:number|null;
  candidate:string|null;
  candidateRange:[number,number]|null;
  path:string[];
  seen:string[];
  best:number;
  callStack:UniqueSplitCallView[];
  childResult:number|null;
  action:'start'|'candidate'|'reject'|'choose'|'base'|'return'|'remove'|'complete';
}
