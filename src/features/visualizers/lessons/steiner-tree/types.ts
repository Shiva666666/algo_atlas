import type { GraphEdgeView, GraphNodeView, InsightModel, RuleFocus } from '../../core/types';

export interface SteinerFrameData {
  stage: 'floyd-warshall' | 'steiner-dp';
  graph: { nodes: GraphNodeView[]; edges: GraphEdgeView[] };
  expandedGraph?: { nodes: GraphNodeView[]; edges: GraphEdgeView[] };
  fixed: number[];
  s: number;
  t: number;
  layer: 'comparison' | 'base' | 'with-s' | 'answer';
  transition:
    | 'overview'
    | 'seed'
    | 'merge'
    | 'relax'
    | 'query-seed'
    | 'lookup'
    | 'reconstruct'
    | 'handoff';
  mask: number;
  maskWidth: number;
  maskTerminals: number[];
  submask: number | null;
  otherMask: number | null;
  root: number | null;
  target: number | null;
  dpRow: Array<number | null>;
  dpTable: Array<Array<number | null>>;
  oldDpRow: Array<number | null> | null;
  oldCost: number | null;
  candidateCost: number | null;
  newCost: number | null;
  answer: number | null;
  distanceMatrix: Array<Array<number | null>>;
  floyd?: {
    matrix: Array<Array<number | null>>;
    original: Array<Array<number | null>>;
    intermediate: number | null;
    current: [number, number] | null;
    oldDistance: number | null;
    viaDistance: number | null;
    newDistance: number | null;
    accepted: boolean | null;
    candidatePath: number[];
    completedIntermediates: number[];
    sealed: boolean;
  };
  comparison?: { naive: string; intended: string };
  insights: InsightModel;
  rules: RuleFocus[];
}

export interface SteinerInput {
  n: number;
  k: number;
  c: number[][];
  query: [number, number];
}
export type Matrix = number[][];
export type BaseParent =
  | { type: 'seed' }
  | { type: 'merge'; left: number; right: number }
  | { type: 'move'; from: number }
  | null;
export type WithParent =
  | { type: 'seed-s' }
  | { type: 'merge'; left: number; rightBase: number }
  | { type: 'move'; from: number }
  | null;
export type TraceRole = 'checkpoint' | 'transition';
export type DpLayer = 'base' | 'with-s';
export type DpEvent = {
  layer: DpLayer;
  type: 'merge' | 'relax';
  mask: number;
  submask: number | null;
  otherMask: number | null;
  root: number | null;
  target: number | null;
  old: number;
  candidate: number;
  next: number;
  table: Matrix;
  oldRow: number[] | null;
  traceRole: TraceRole;
};
export type FloydEvent = {
  kind: 'start' | 'intermediate-start' | 'cell' | 'intermediate-end' | 'sealed';
  intermediate: number | null;
  current: [number, number] | null;
  old: number | null;
  via: number | null;
  next: number | null;
  accepted: boolean | null;
  matrix: Matrix;
  completedIntermediates: number[];
  traceRole: TraceRole;
};
