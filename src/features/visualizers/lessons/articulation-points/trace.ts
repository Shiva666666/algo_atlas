import { AP, V } from './reference';
export { AP, V } from './reference';
import type { LessonFrameData, LessonValue } from './types';

import type { VisualFrame } from '../../core/types';

export const f = (
  title: string,
  message: string,
  data: LessonValue,
  codeFocus: string[] = [],
): VisualFrame<LessonFrameData> => ({
  phase: 'TRACE',
  title,
  message,
  kind: 'algorithm-state',
  data: { value: data, activePath: [], transitionIndex: 0 },
  codeFocus,
});

export const p = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Use valid JSON input.');
  }
};

export function apFrames(v: any) {
  const frames: VisualFrame<LessonFrameData>[] = [];
  const seen = new Set<number>(),
    disc: number[] = Array(v.V).fill(0),
    low: number[] = Array(v.V).fill(0);
  let timer = 0;
  const adj: number[][] = Array.from({ length: v.V }, () => []);
  for (const [a, b] of v.edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  const aps = new Set<number>();
  function dfs(u: number, parent: number) {
    seen.add(u);
    disc[u] = low[u] = timer++;
    frames.push(
      f(
        `Visit ${u}`,
        `disc=${disc[u]}, low=${low[u]}; 0 is a timestamp, so seen marks unvisited.`,
        {
          variant: 'articulation',
          V: v.V,
          edges: v.edges,
          seen: [...seen],
          disc: [...disc],
          low: [...low],
          stack: [u],
        },
      ),
    );
    let children = 0;
    for (const w of adj[u]) {
      if (!seen.has(w)) {
        children++;
        dfs(w, u);
        low[u] = Math.min(low[u], low[w]);
        frames.push(
          f(
            `Return ${w}  ->  ${u}`,
            `low[${u}] becomes ${low[u]}; test low[child]  >=  discovery[curr].`,
            {
              variant: 'articulation',
              V: v.V,
              edges: v.edges,
              seen: [...seen],
              disc: [...disc],
              low: [...low],
              active: [u, w],
            },
          ),
        );
        if (parent !== -1 && low[w] >= disc[u]) {
          aps.add(u);
          frames.push(
            f(`${u} is a cut vertex`, `low[${w}]=${low[w]}  >=  disc[${u}]=${disc[u]}.`, {
              variant: 'articulation',
              V: v.V,
              edges: v.edges,
              disc: [...disc],
              low: [...low],
              active: [u, w],
            }),
          );
        }
      } else if (w !== parent) {
        low[u] = Math.min(low[u], disc[w]);
        frames.push(
          f(
            `Back edge ${u}  ->  ${w}`,
            `Visited non-parent neighbor updates low[${u}] to ${low[u]}.`,
            {
              variant: 'articulation',
              V: v.V,
              edges: v.edges,
              disc: [...disc],
              low: [...low],
              active: [u, w],
            },
          ),
        );
      }
    }
    if (parent === -1 && children > 1) aps.add(u);
  }
  for (let i = 0; i < v.V; i++) if (!seen.has(i)) dfs(i, -1);
  frames.push(
    f(
      'Return sorted result',
      aps.size ? `Result [${[...aps].sort((a, b) => a - b)}]` : 'Result [-1].',
      { variant: 'articulation', result: [...aps].sort((a, b) => a - b) },
    ),
  );
  return frames;
}

export const presets = (items: any[], source: any = 'Diagnostic') =>
  items.map(([label, input]: any) => ({ label, input, source }));
