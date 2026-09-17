import type { TicketInput } from './types';
export type { TicketInput } from './types';
import type { Problem } from '../../../../shared/contracts/index';

import type {
  GraphEdgeView,
  GraphNodeView,
  InsightModel,
  IntuitionFrameData,
  RuleFocus,
  TreePathView,
  VisualFrame,
} from '../../core/types';

export const insights: InsightModel = {
  state:
    'The selected object is one simple path in an existing tree; a useful DP state exposes at most one open arm to its parent.',
  base: 'At a leaf, the only unfinished path endpoint is the leaf itself; no road is paid until the path extends.',
  choice:
    'Continue one child arm upward, or join two child arms through the current node to finish a path.',
  invariant:
    'Every selected vertex has path-degree at most 2. A branching Steiner shape is never a legal candidate here.',
};

export function rules(active: string): RuleFocus[] {
  return [
    { token: 'tree', meaning: 'one route per endpoint pair', active: active === 'tree' },
    { token: 'u…v path', meaning: 'the complete decision object', active: active === 'path' },
    { token: '− road costs', meaning: 'pay selected edges', active: active === 'cost' },
    {
      token: '+ tickets inside',
      meaning: 'reward endpoints on the path',
      active: active === 'tickets',
    },
    { token: 'degree ≤ 2', meaning: 'never branch', active: active === 'invariant' },
  ];
}

export function parseInput(raw: string): TicketInput {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Use JSON with n, roads, tickets, and choice.');
  }
  if (!value || typeof value !== 'object')
    throw new Error('The input needs n, roads, tickets, and choice.');
  const input = value as Partial<TicketInput>;
  const n = Number(input.n);
  if (!Number.isInteger(n) || n < 2 || n > 10)
    throw new Error('Use 2 to 10 cities for a readable tree.');
  if (
    !Array.isArray(input.roads) ||
    input.roads.length !== n - 1 ||
    !input.roads.every((edge) => Array.isArray(edge) && edge.length === 3)
  )
    throw new Error('roads must contain exactly n−1 [u,v,cost] edges.');
  if (
    !Array.isArray(input.tickets) ||
    !input.tickets.every((ticket) => Array.isArray(ticket) && ticket.length === 3)
  )
    throw new Error('tickets must be [u,v,value] triples.');
  if (!Array.isArray(input.choice) || input.choice.length !== 2)
    throw new Error('choice must be [u,v].');
  return {
    n,
    roads: input.roads.map((edge) => edge.map(Number) as [number, number, number]),
    tickets: input.tickets.map((ticket) => ticket.map(Number) as [number, number, number]),
    choice: input.choice.map(Number) as [number, number],
  };
}

export function pathBetween(input: TicketInput) {
  const adjacency = Array.from(
    { length: input.n + 1 },
    () => [] as Array<{ to: number; cost: number }>,
  );
  input.roads.forEach(([a, b, cost]) => {
    adjacency[a].push({ to: b, cost });
    adjacency[b].push({ to: a, cost });
  });
  const [start, target] = input.choice;
  const parent = Array(input.n + 1).fill(-1);
  parent[start] = 0;
  const queue = [start];
  while (queue.length) {
    const node = queue.shift()!;
    if (node === target) break;
    for (const edge of adjacency[node])
      if (parent[edge.to] === -1) {
        parent[edge.to] = node;
        queue.push(edge.to);
      }
  }
  if (parent[target] === -1) throw new Error('roads must form one connected tree.');
  const path = [] as number[];
  for (let node = target; node !== 0; node = parent[node]) {
    path.push(node);
    if (node === start) break;
  }
  return path.reverse();
}

export function graph(
  input: TicketInput,
  path: number[],
  show: boolean,
  activeNode: number | null,
) {
  const [start, target] = input.choice;
  const selected = new Set(
    path.slice(1).map((node, index) => {
      const previous = path[index];
      return previous < node ? `${previous}-${node}` : `${node}-${previous}`;
    }),
  );
  const nodes: GraphNodeView[] = Array.from({ length: input.n }, (_, index) => {
    const id = index + 1;
    return {
      id,
      label: String(id),
      role:
        id === start
          ? 'source'
          : id === target
            ? 'target'
            : id === activeNode
              ? 'root'
              : 'ordinary',
      detail:
        id === start
          ? 'endpoint u'
          : id === target
            ? 'endpoint v'
            : id === activeNode
              ? 'current node'
              : '',
    };
  });
  const edges: GraphEdgeView[] = input.roads.map(([a, b, cost]) => ({
    from: a,
    to: b,
    weight: cost,
    state: show && selected.has(a < b ? `${a}-${b}` : `${b}-${a}`) ? 'selected' : 'quiet',
  }));
  return { nodes, edges };
}

export function frame(
  phase: string,
  title: string,
  message: string,
  input: TicketInput,
  path: number[],
  show: boolean,
  branchComparison: boolean,
  active: string,
  activeNode: number | null,
): VisualFrame<IntuitionFrameData> {
  const view: TreePathView = {
    graph: graph(input, path, show, activeNode),
    path: show ? [...path] : [],
    activeNode,
    branchComparison,
  };
  return {
    phase,
    title,
    message,
    kind: 'intuition',
    data: {
      variant: 'tree-path',
      insights,
      rules: rules(active),
      treePath: view,
    } satisfies IntuitionFrameData,
  };
}

export function createFrames(value: unknown, _problem: Problem): VisualFrame<IntuitionFrameData>[] {
  const input = value as TicketInput;
  const path = pathBetween(input);
  const pathSet = new Set(path);
  const roadCost = path.slice(1).reduce((sum, node, index) => {
    const previous = path[index];
    return (
      sum +
      (input.roads.find(
        ([a, b]) => (a === previous && b === node) || (a === node && b === previous),
      )?.[2] ?? 0)
    );
  }, 0);
  const earned = input.tickets
    .filter(([a, b]) => pathSet.has(a) && pathSet.has(b))
    .reduce((sum, ticket) => sum + ticket[2], 0);
  return [
    frame(
      'CLASSIFY',
      'Steiner Tree may branch',
      'A Steiner solution can connect several terminals through a degree-3 or degree-4 junction.',
      input,
      path,
      false,
      true,
      'invariant',
      null,
    ),
    frame(
      'CLASSIFY',
      'Ticket to Ride chooses one path',
      'Because the road plan is already a tree, endpoints determine exactly one simple path.',
      input,
      path,
      true,
      false,
      'tree',
      null,
    ),
    frame(
      'STATE',
      `Expose path ${path.join(' → ')}`,
      'The DP should describe an open path arm, not a subset of terminals.',
      input,
      path,
      true,
      false,
      'path',
      path[Math.floor(path.length / 2)],
    ),
    frame(
      'COST',
      `Pay ${roadCost} for its roads`,
      'Only edges on the chosen simple path contribute construction cost.',
      input,
      path,
      true,
      false,
      'cost',
      null,
    ),
    frame(
      'REWARD',
      `Collect ${earned} from contained tickets`,
      'A ticket contributes when both of its endpoints lie somewhere on this path.',
      input,
      path,
      true,
      false,
      'tickets',
      null,
    ),
    frame(
      'COMPLETE',
      `Path profit = ${earned - roadCost}`,
      `Classification signal: fixed tree + choose one path + path rewards/costs → tree/path DP, not Steiner DP.`,
      input,
      path,
      true,
      false,
      'invariant',
      null,
    ),
  ];
}
