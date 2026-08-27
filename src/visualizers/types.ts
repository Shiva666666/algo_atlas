import type {Problem} from '../types';

export interface VisualPreset {
  label:string;
  input:string;
  source:'LeetCode'|'AtCoder'|'HackerRank'|'Diagnostic'|'Starter';
}

export interface VisualFrame {
  phase:string;
  title:string;
  message:string;
  kind:'palindrome-cuts'|'generic'|'steiner-tree'|'monotonic-window'|'intuition';
  data:unknown;
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
  graph:{nodes:GraphNodeView[];edges:GraphEdgeView[]};
  fixed:number[];
  s:number;
  t:number;
  layer:'comparison'|'base'|'with-s'|'answer';
  mask:number;
  maskWidth:number;
  maskTerminals:number[];
  submask:number|null;
  root:number|null;
  target:number|null;
  dpRow:Array<number|null>;
  oldCost:number|null;
  candidateCost:number|null;
  newCost:number|null;
  answer:number;
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

export type IntuitionVariant='binary-search'|'graph-coloring'|'grid-dp'|'subset-pruning'|'dual-heap'|'tree-path';

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
  presets:VisualPreset[];
  parseInput:(raw:string)=>unknown;
  createFrames:(input:unknown,problem:Problem)=>VisualFrame[];
}
