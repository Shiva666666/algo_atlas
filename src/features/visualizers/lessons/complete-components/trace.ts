import source from './reference.py?raw';
import type { VisualFrame } from '../../core/types';
import { addFrame, integer, parseObject } from '../../core/trace';
import type { DiagramState, WorkbenchEdge, WorkbenchNode } from '../../core/traversal';
import type { CompleteComponentsData, CompleteComponentsInput, ComponentVerdict } from './types';

export const completeComponentsCode = source.trimEnd();

export function parseCompleteComponentsInput(raw: string): CompleteComponentsInput {
  const value = parseObject(raw);
  const n = integer(value.n, 'n', 1, 10);
  if (!Array.isArray(value.edges)) throw new Error('edges must be an array of vertex pairs.');
  const keys = new Set<string>();
  const edges = value.edges.map((edge, index) => {
    if (
      !Array.isArray(edge) ||
      edge.length !== 2 ||
      !edge.every((v) => Number.isInteger(v) && v >= 0 && v < n)
    )
      throw new Error(`Edge ${index + 1} must contain two vertices from 0 to ${n - 1}.`);
    const [a, b] = edge as number[];
    if (a === b) throw new Error('Self edges are not supported.');
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    if (keys.has(key)) throw new Error('Duplicate undirected edges are not supported.');
    keys.add(key);
    return [a, b];
  });
  return { n, edges };
}

function componentLayout(n: number, graph: number[][]) {
  const groups: number[][] = [];
  const visited = new Set<number>();
  for (let start = 0; start < n; start++)
    if (!visited.has(start)) {
      const group: number[] = [];
      const queue = [start];
      visited.add(start);
      while (queue.length) {
        const node = queue.shift()!;
        group.push(node);
        for (const next of graph[node])
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
      }
      groups.push(group);
    }
  const columns = Math.min(5, Math.max(1, groups.length));
  const rows = Math.ceil(groups.length / columns);
  const centers = groups.map((_, index) => ({
    x: columns === 1 ? 320 : 70 + (index % columns) * (500 / (columns - 1)),
    y: rows === 1 ? 175 : 90 + Math.floor(index / columns) * (170 / (rows - 1)),
  }));
  const positions = new Map<number, { x: number; y: number; component: number }>();
  groups.forEach((group, component) =>
    group.forEach((node, index) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * index) / Math.max(1, group.length);
      positions.set(node, {
        x: centers[component].x + Math.cos(angle) * (group.length === 1 ? 0 : 56),
        y: centers[component].y + Math.sin(angle) * (group.length === 1 ? 0 : 48),
        component,
      });
    }),
  );
  return positions;
}

export function createCompleteComponentsFrames(
  value: unknown,
): VisualFrame<CompleteComponentsData>[] {
  const { n, edges } = parseCompleteComponentsInput(JSON.stringify(value));
  const graph = Array.from({ length: n }, () => [] as number[]);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }
  graph.forEach((neighbors) => neighbors.sort((a, b) => a - b));
  const positions = componentLayout(n, graph);
  const frames: VisualFrame<CompleteComponentsData>[] = [];
  const seen = new Set<number>();
  const stack: number[] = [];
  let component: number[] = [];
  let currentNode: number | null = null;
  let auditNode: number | null = null;
  let expectedDegree: number | null = null;
  const verdicts: ComponentVerdict[] = [];
  let result: number | null = null;
  let action = 'build';
  const renderGraph = () => {
    const activeVerdict = verdicts.find((item) => item.nodes.includes(auditNode ?? -1));
    const nodes: WorkbenchNode[] = Array.from({ length: n }, (_, id) => {
      let state: DiagramState = seen.has(id) ? 'seen' : 'idle';
      if (component.includes(id)) state = 'frontier';
      if (id === currentNode || id === auditNode) state = 'active';
      if (activeVerdict && !activeVerdict.complete && activeVerdict.nodes.includes(id))
        state = 'rejected';
      const point = positions.get(id)!;
      return { id, label: String(id), detail: `degree ${graph[id].length}`, state, ...point };
    });
    const graphEdges: WorkbenchEdge[] = edges.map(([a, b]) => ({
      from: a,
      to: b,
      state: a === currentNode || b === currentNode ? 'active' : 'idle',
    }));
    return { nodes, edges: graphEdges, label: 'Connected components and their internal edges' };
  };
  const state = (): CompleteComponentsData => ({
    n,
    edgesInput: edges.map((edge) => [...edge]),
    seen: [...seen],
    stack: [...stack],
    component: [...component],
    currentNode,
    auditNode,
    expectedDegree,
    verdicts: structuredClone(verdicts),
    action,
    result,
    heading: 'Collect the component, then audit every degree',
    summary:
      'A connected component of size k is complete exactly when every vertex has degree k − 1.',
    legend: [
      { symbol: '○', label: 'Unseen', color: '#778394' },
      { symbol: 'D', label: 'DFS component', color: '#9b8cff' },
      { symbol: '→', label: 'Current audit', color: '#37d9ff' },
      { symbol: '×', label: 'Incomplete', color: '#f06cae' },
    ],
    graph: renderGraph(),
    frontier: {
      label: 'DFS ancestry',
      kind: 'stack',
      items: stack.map((node, index) => ({
        id: `${index}-${node}`,
        primary: `dfs(${node})`,
        secondary: index === stack.length - 1 ? 'active' : 'waiting',
        state: index === stack.length - 1 ? 'active' : 'frontier',
      })),
    },
    metrics: [
      { label: 'Component', value: component.length ? `{${component.join(', ')}}` : '—' },
      { label: 'k', value: component.length ? String(component.length) : '—' },
      { label: 'Expected degree', value: expectedDegree === null ? '—' : String(expectedDegree) },
      {
        label: 'Complete count',
        value: String(result ?? verdicts.filter((item) => item.complete).length),
      },
    ],
    equation:
      auditNode === null
        ? 'degree(v) = k − 1'
        : `${graph[auditNode].length} ${graph[auditNode].length === expectedDegree ? '=' : '≠'} ${expectedDegree}`,
    results: verdicts.map((item, index) => ({
      label: `Component ${index + 1}: {${item.nodes.join(', ')}}`,
      value: item.complete ? 'complete' : `missing ${item.missing.join(', ')}`,
      state: item.complete ? 'success' : 'rejected',
    })),
  });
  const emit = (phase: string, title: string, message: string, snippet: string) => {
    action = phase;
    addFrame(
      frames,
      completeComponentsCode,
      'complete-components',
      state(),
      phase,
      title,
      message,
      snippet,
    );
  };
  emit(
    'build',
    'Build an undirected adjacency list',
    'Each input edge is stored in both directions.',
    'graph = defaultdict(list)',
  );
  const dfs = (node: number) => {
    currentNode = node;
    stack.push(node);
    seen.add(node);
    component.push(node);
    emit(
      'visit',
      `Add ${node} to this component`,
      'DFS membership is fixed before following its neighbors.',
      'seen.add(node)',
    );
    emit(
      'collect',
      `Component now has ${component.length} vertex${component.length === 1 ? '' : 'es'}`,
      'The degree rule is evaluated only after the whole component is known.',
      'component.append(node)',
    );
    for (const neighbor of graph[node]) {
      currentNode = node;
      emit(
        'inspect-edge',
        `Inspect edge ${node} — ${neighbor}`,
        seen.has(neighbor)
          ? 'The neighbor already belongs to a discovered component.'
          : 'The neighbor starts a child DFS call.',
        'for neighbor in graph[node]:',
      );
      if (!seen.has(neighbor)) dfs(neighbor);
    }
    stack.pop();
    currentNode = stack.at(-1) ?? null;
  };
  for (let node = 0; node < n; node++)
    if (!seen.has(node)) {
      component = [];
      currentNode = node;
      auditNode = null;
      expectedDegree = null;
      emit(
        'component-start',
        `Start a component at ${node}`,
        'Every unseen vertex begins exactly one connected component.',
        'if node not in seen:',
      );
      dfs(node);
      currentNode = null;
      expectedDegree = component.length - 1;
      emit(
        'audit-start',
        `Freeze k = ${component.length}`,
        'Now every degree can be compared with k − 1.',
        'size = len(component)',
      );
      let complete = true;
      for (const vertex of component) {
        auditNode = vertex;
        emit(
          'degree-audit',
          `Vertex ${vertex}: degree ${graph[vertex].length}`,
          graph[vertex].length === expectedDegree
            ? 'This vertex connects to every other vertex in its component.'
            : 'At least one pair is missing, so this component cannot be complete.',
          'if all(len(graph[vertex]) == size - 1 for vertex in component):',
        );
        if (graph[vertex].length !== expectedDegree) complete = false;
      }
      const missing: string[] = [];
      for (let i = 0; i < component.length; i++)
        for (let j = i + 1; j < component.length; j++)
          if (!graph[component[i]].includes(component[j]))
            missing.push(`${component[i]}—${component[j]}`);
      verdicts.push({ nodes: [...component], complete, missing });
      auditNode = null;
      if (complete)
        emit(
          'accept',
          'Count this complete component',
          component.length === 1
            ? 'An isolated vertex is complete: degree 0 equals k − 1.'
            : 'Every vertex passed the degree audit.',
          'complete_count += 1',
        );
    }
  component = [];
  expectedDegree = null;
  result = verdicts.filter((item) => item.complete).length;
  emit(
    'result',
    `Return ${result}`,
    `${result} connected component${result === 1 ? '' : 's'} passed the completeness audit.`,
    'return complete_count',
  );
  return frames;
}
