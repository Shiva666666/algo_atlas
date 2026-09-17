import type { BipartiteInput } from './types';
export type { BipartiteInput } from './types';
import type { Problem } from '../../../../shared/contracts/index';

import type {
  GraphEdgeView,
  GraphNodeView,
  InsightModel,
  IntuitionFrameData,
  RuleFocus,
  VisualFrame,
} from '../../core/types';

export const insights: InsightModel = {
  state:
    'color[v] is unassigned, side A, or side B; the queue stores colored vertices whose edges still need checking.',
  base: 'Each disconnected component may start from any uncolored vertex with either color.',
  choice:
    'An uncolored neighbor gets the opposite color; an already colored neighbor must disagree.',
  invariant: 'Every processed edge has endpoints on opposite sides.',
};

export function rules(active: string): RuleFocus[] {
  return [
    { token: 'color[start]=A', meaning: 'seed each component', active: active === 'seed' },
    { token: 'queue', meaning: 'process colored vertices', active: active === 'queue' },
    { token: '1-color[v]', meaning: 'opposite side', active: active === 'color' },
    { token: 'color[u]==color[v]', meaning: 'conflict', active: active === 'conflict' },
    {
      token: 'all components',
      meaning: 'do not stop after node 0',
      active: active === 'components',
    },
  ];
}

export function parseInput(raw: string): BipartiteInput {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Use {"graph":[[1,3],[0,2],[1,3],[0,2]]}.');
  }
  const graph = Array.isArray(value) ? value : (value as { graph?: unknown })?.graph;
  if (
    !Array.isArray(graph) ||
    !graph.every((row) => Array.isArray(row) && row.every((item) => Number.isInteger(Number(item))))
  )
    throw new Error('graph must be an adjacency-list array.');
  if (graph.length > 10) throw new Error('Use at most 10 nodes for a readable trace.');
  const normalized = graph.map((row) => (row as unknown[]).map(Number));
  if (normalized.some((row) => row.some((node) => node < 0 || node >= normalized.length)))
    throw new Error('Every neighbor must be a valid node index.');
  return { graph: normalized };
}

export function key(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function graphView(
  adjacency: number[][],
  colors: Array<number | null>,
  processed: Set<string>,
  active: [number, number] | null,
  conflict: [number, number] | null,
) {
  const nodes: GraphNodeView[] = colors.map((color, id) => ({
    id,
    label: String(id),
    role: conflict?.includes(id)
      ? 'conflict'
      : color === 0
        ? 'color-a'
        : color === 1
          ? 'color-b'
          : 'ordinary',
    detail: color === 0 ? 'side A' : color === 1 ? 'side B' : 'uncolored',
  }));
  const edges: GraphEdgeView[] = [];
  adjacency.forEach((neighbors, from) =>
    neighbors.forEach((to) => {
      if (from < to) {
        const edgeKey = key(from, to);
        edges.push({
          from,
          to,
          state:
            conflict && edgeKey === key(...conflict)
              ? 'rejected'
              : active && edgeKey === key(...active)
                ? 'active'
                : processed.has(edgeKey)
                  ? 'selected'
                  : 'quiet',
        });
      }
    }),
  );
  return { nodes, edges };
}

export function frame(
  phase: string,
  title: string,
  message: string,
  adjacency: number[][],
  colors: Array<number | null>,
  queue: number[],
  processed: Set<string>,
  active: [number, number] | null,
  valid: boolean | null,
  activeRule: string,
  activeNode: number | null,
): VisualFrame<IntuitionFrameData> {
  return {
    phase,
    title,
    message,
    kind: 'intuition',
    data: {
      variant: 'graph-coloring',
      insights,
      rules: rules(activeRule),
      graphColoring: {
        graph: graphView(
          adjacency,
          colors,
          processed,
          active,
          valid === false && active ? active : null,
        ),
        queue: [...queue],
        colors: [...colors],
        activeNode,
        valid,
      },
    } satisfies IntuitionFrameData,
  };
}

export function createFrames(value: unknown, _problem: Problem): VisualFrame<IntuitionFrameData>[] {
  const { graph } = value as BipartiteInput;
  const colors: Array<number | null> = Array(graph.length).fill(null);
  const queue: number[] = [];
  const processed = new Set<string>();
  const frames: VisualFrame<IntuitionFrameData>[] = [
    frame(
      'STATE',
      'One bit of state per node',
      'The actual numbers 0 and 1 do not matter; only opposite-versus-same matters.',
      graph,
      colors,
      queue,
      processed,
      null,
      null,
      'components',
      null,
    ),
  ];
  for (let start = 0; start < graph.length; start += 1) {
    if (colors[start] !== null) continue;
    colors[start] = 0;
    queue.push(start);
    frames.push(
      frame(
        'BASE',
        `Start component at ${start}`,
        `Node ${start} was still uncolored, so seed a fresh BFS component.`,
        graph,
        colors,
        queue,
        processed,
        null,
        null,
        'seed',
        start,
      ),
    );
    while (queue.length) {
      const node = queue.shift()!;
      frames.push(
        frame(
          'QUEUE',
          `Inspect node ${node}`,
          `Every neighbor must land on side ${colors[node] === 0 ? 'B' : 'A'}.`,
          graph,
          colors,
          queue,
          processed,
          null,
          null,
          'queue',
          node,
        ),
      );
      for (const neighbor of graph[node]) {
        const edgeId = key(node, neighbor);
        if (processed.has(edgeId)) continue;
        if (colors[neighbor] === null) {
          colors[neighbor] = 1 - colors[node]!;
          queue.push(neighbor);
          processed.add(edgeId);
          frames.push(
            frame(
              'COLOR',
              `Color ${neighbor} opposite ${node}`,
              `The edge ${node}–${neighbor} is now safe; enqueue ${neighbor} so its own edges are checked later.`,
              graph,
              colors,
              queue,
              processed,
              [node, neighbor],
              null,
              'color',
              neighbor,
            ),
          );
        } else if (colors[neighbor] === colors[node]) {
          frames.push(
            frame(
              'CONFLICT',
              `Edge ${node}–${neighbor} breaks the invariant`,
              'Both endpoints already have the same color, so no two-side partition can satisfy every edge.',
              graph,
              colors,
              queue,
              processed,
              [node, neighbor],
              false,
              'conflict',
              node,
            ),
          );
          return frames;
        } else {
          processed.add(edgeId);
          frames.push(
            frame(
              'CHECK',
              `Edge ${node}–${neighbor} is consistent`,
              'The neighbor was already colored on the opposite side; no state change is needed.',
              graph,
              colors,
              queue,
              processed,
              [node, neighbor],
              null,
              'conflict',
              node,
            ),
          );
        }
      }
    }
  }
  frames.push(
    frame(
      'COMPLETE',
      'Every component is valid',
      'All edges connect opposite colors.',
      graph,
      colors,
      queue,
      processed,
      null,
      true,
      'components',
      null,
    ),
  );
  return frames;
}
