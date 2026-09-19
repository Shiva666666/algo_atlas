import type { TraversalLessonData } from '../../core/traversal';

export interface CompleteComponentsInput {
  n: number;
  edges: number[][];
}
export interface ComponentVerdict {
  nodes: number[];
  complete: boolean;
  missing: string[];
}
export interface CompleteComponentsData extends TraversalLessonData {
  n: number;
  edgesInput: number[][];
  seen: number[];
  stack: number[];
  component: number[];
  currentNode: number | null;
  auditNode: number | null;
  expectedDegree: number | null;
  verdicts: ComponentVerdict[];
  action: string;
  result: number | null;
}
