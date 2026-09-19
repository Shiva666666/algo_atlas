import source from './reference.py?raw';
import type { VisualFrame } from '../../core/types';
import { addFrame, integer, parseObject } from '../../core/trace';
import type { DiagramState, WorkbenchEdge, WorkbenchNode } from '../../core/traversal';
import type { FindCityData, FindCityInput } from './types';

export const findCityCode = source.trimEnd();
export function parseFindCityInput(raw: string): FindCityInput {
  const value = parseObject(raw);
  const n = integer(value.n, 'n', 2, 7);
  const threshold = integer(value.distanceThreshold, 'distanceThreshold', 0, 100);
  if (!Array.isArray(value.edges)) throw new Error('edges must be an array.');
  const pairs = new Set<string>();
  const edges = value.edges.map((edge, index) => {
    if (!Array.isArray(edge) || edge.length !== 3)
      throw new Error(`edges[${index}] must be [u, v, weight].`);
    const u = integer(edge[0], `edges[${index}][0]`, 0, n - 1),
      v = integer(edge[1], `edges[${index}][1]`, 0, n - 1),
      w = integer(edge[2], `edges[${index}][2]`, 1, 100);
    if (u === v) throw new Error('Self edges are not supported.');
    const pair = [u, v].sort((a, b) => a - b).join('-');
    if (pairs.has(pair)) throw new Error('Use one edge per city pair.');
    pairs.add(pair);
    return [u, v, w];
  });
  return { n, edges, distanceThreshold: threshold };
}
export function createFindCityFrames(value: unknown): VisualFrame<FindCityData>[] {
  const { n, edges, distanceThreshold } = parseFindCityInput(JSON.stringify(value));
  const distance = Array.from({ length: n }, () => Array<number>(n).fill(Infinity));
  const counts: Array<number | null> = Array(n).fill(null);
  const frames: VisualFrame<FindCityData>[] = [];
  let middle: number | null = null,
    active: [number, number, number] | null = null,
    answer: number | null = null,
    action = 'initialize';
  const graph = () => {
    const nodes: WorkbenchNode[] = Array.from({ length: n }, (_, id) => {
      const angle = -Math.PI / 2 + (id * Math.PI * 2) / n;
      let state: DiagramState = 'idle';
      if (id === middle) state = 'frontier';
      if (active && (id === active[0] || id === active[2])) state = 'candidate';
      if (id === answer) state = 'success';
      return {
        id,
        x: 320 + Math.cos(angle) * 205,
        y: 175 + Math.sin(angle) * 125,
        state,
        detail: counts[id] === null ? undefined : `${counts[id]} reachable`,
      };
    });
    const graphEdges: WorkbenchEdge[] = edges.map(([from, to, weight]) => ({
      from,
      to,
      weight,
      state:
        active &&
        ((active[0] === from && active[2] === to) || (active[0] === to && active[2] === from))
          ? 'active'
          : 'idle',
    }));
    return { nodes, edges: graphEdges, label: 'Weighted city graph' };
  };
  const state = (): FindCityData => ({
    n,
    edges: edges.map((edge) => [...edge]),
    distance: distance.map((row) => row.map((item) => (Number.isFinite(item) ? item : null))),
    middle,
    active,
    counts: [...counts],
    answer,
    action,
    heading: 'Floyd–Warshall opens one intermediate city at a time',
    summary:
      'The matrix and graph describe the same real edges; each layer allows paths through cities 0…k.',
    legend: [
      { symbol: 'k', label: 'Allowed middle', color: '#9b8cff' },
      { symbol: 'i/j', label: 'Active endpoints', color: '#37d9ff' },
      { symbol: '✓', label: 'Current winner', color: '#4fd1a1' },
    ],
    graph: graph(),
    matrix: {
      values: distance.map((row) => row.map((item) => (Number.isFinite(item) ? item : null))),
      label: middle === null ? 'Distance matrix' : `Distances after allowing middle ${middle}`,
      active: active
        ? [
            [active[0], active[2]],
            [active[0], active[1]],
            [active[1], active[2]],
          ]
        : undefined,
    },
    metrics: [
      { label: 'Threshold', value: String(distanceThreshold) },
      { label: 'Middle k', value: middle === null ? '—' : String(middle) },
      { label: 'Active route', value: active ? `${active[0]} → ${active[1]} → ${active[2]}` : '—' },
      { label: 'Winner', value: answer === null ? '—' : String(answer) },
    ],
    equation: active
      ? `d[${active[0]}][${active[2]}] = min(old, d[${active[0]}][${active[1]}] + d[${active[1]}][${active[2]}])`
      : 'initialize direct distances',
    results: counts.flatMap((count, city) =>
      count === null
        ? []
        : [
            {
              label: `City ${city}`,
              value: `${count} neighbors`,
              state: city === answer ? ('success' as const) : ('idle' as const),
            },
          ],
    ),
  });
  const emit = (phase: string, title: string, message: string, snippet: string) => {
    action = phase;
    addFrame(frames, findCityCode, 'find-city', state(), phase, title, message, snippet);
  };
  for (let city = 0; city < n; city++) distance[city][city] = 0;
  emit(
    'diagonal',
    'Each city reaches itself at cost 0',
    'This diagonal is needed for shortest paths, but self is excluded from the final neighbor count.',
    'distance[city][city] = 0',
  );
  for (const [start, end, weight] of edges) {
    distance[start][end] = Math.min(distance[start][end], weight);
    distance[end][start] = Math.min(distance[end][start], weight);
    active = [start, start, end];
    emit(
      'edge',
      `Initialize ${start} ↔ ${end} with ${weight}`,
      'The graph is undirected, so both matrix cells receive the edge weight.',
      'distance[start][end] = min(distance[start][end], weight)',
    );
  }
  active = null;
  for (let k = 0; k < n; k++) {
    middle = k;
    emit(
      'layer',
      `Allow city ${k} as an intermediate`,
      `This chapter considers every i → ${k} → j route.`,
      'for middle in range(n):',
    );
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        active = [i, k, j];
        const old = distance[i][j],
          candidate = distance[i][k] + distance[k][j];
        if (candidate < old) {
          distance[i][j] = candidate;
          emit(
            'relax',
            `Improve ${i} → ${j}: ${old === Infinity ? '∞' : old} → ${candidate}`,
            `The route through ${k} is shorter.`,
            'distance[start][end] = min(',
          );
        }
      }
  }
  active = null;
  middle = null;
  let fewest = Infinity;
  for (let city = 0; city < n; city++) {
    counts[city] = distance[city].filter(
      (cost, other) => city !== other && cost <= distanceThreshold,
    ).length;
    if (counts[city]! <= fewest) {
      fewest = counts[city]!;
      answer = city;
    }
    emit(
      'rank',
      `City ${city}: ${counts[city]} qualified neighbors`,
      counts[city]! <= fewest
        ? 'A tie replaces the winner, so the greatest index wins.'
        : 'This city reaches more neighbors than the current winner.',
      'if reachable <= fewest:',
    );
  }
  emit(
    'result',
    `Return city ${answer}`,
    'The selected city has the fewest threshold-qualified neighbors; ties favor the greatest number.',
    'return answer',
  );
  return frames;
}
