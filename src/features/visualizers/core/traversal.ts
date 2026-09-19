export type DiagramState =
  | 'idle'
  | 'frontier'
  | 'active'
  | 'seen'
  | 'success'
  | 'rejected'
  | 'blocked'
  | 'candidate';

export interface WorkbenchNode {
  id: number;
  label?: string;
  detail?: string;
  state?: DiagramState;
  x?: number;
  y?: number;
  component?: number;
}

export interface WorkbenchEdge {
  from: number;
  to: number;
  weight?: number;
  directed?: boolean;
  state?: DiagramState;
}

export interface WorkbenchCell {
  value: string | number;
  state?: DiagramState;
  note?: string;
}

export interface TraversalLessonData {
  heading: string;
  summary: string;
  legend: Array<{ label: string; symbol: string; color: string }>;
  graph?: { nodes: WorkbenchNode[]; edges: WorkbenchEdge[]; label: string };
  grid?: { cells: WorkbenchCell[][]; label: string };
  frontier?: {
    label: string;
    kind: 'queue' | 'stack' | 'min-heap';
    items: Array<{ id: string; primary: string; secondary?: string; state?: DiagramState }>;
  };
  matrix?: { values: Array<Array<number | null>>; label: string; active?: Array<[number, number]> };
  metrics: Array<{ label: string; value: string }>;
  equation?: string;
  results?: Array<{ label: string; value: string; state?: DiagramState }>;
}
