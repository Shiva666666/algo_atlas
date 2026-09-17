import { V } from './reference';
export { V } from './reference';
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

export function vertexFrames(v: any) {
  const idx = Array(v.n).fill(0),
    frames: VisualFrame<LessonFrameData>[] = [];
  for (const [a, b] of v.edges) {
    idx[b]++;
    frames.push(
      f(
        `Scan ${a}  ->  ${b}`,
        `idx[${b}] = ${idx[b]}; this is the executable edge phase, not Kahn/BFS.`,
        { variant: 'vertices', n: v.n, edges: v.edges, idx: [...idx], active: [a, b] },
      ),
    );
  }
  const result: number[] = [];
  for (let i = 0; i < v.n; i++) {
    if (idx[i] === 0) result.push(i);
    frames.push(
      f(
        `Inspect vertex ${i}`,
        idx[i] === 0
          ? `No incoming edge: append ${i}.`
          : `Incoming degree is ${idx[i]}; do not append.`,
        {
          variant: 'vertices',
          n: v.n,
          edges: v.edges,
          idx: [...idx],
          result: [...result],
          active: i,
        },
      ),
    );
  }
  frames.push(
    f('Return sources', `Result [${result}]. Reachability is a separate proof overlay.`, {
      variant: 'vertices',
      n: v.n,
      edges: v.edges,
      result,
    }),
  );
  return frames;
}

export const presets = (items: any[], source: any = 'Diagnostic') =>
  items.map(([label, input]: any) => ({ label, input, source }));
