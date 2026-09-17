import { T } from './reference';
export { T } from './reference';
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

export function triFrames(v: any) {
  const memo: Record<string, number> = {},
    frames: VisualFrame<LessonFrameData>[] = [
      f(
        'Start with the whole polygon',
        'The root interval spans every vertex; each candidate k will split it into two smaller inclusive intervals.',
        {
          variant: 'triangulation',
          values: v.values,
          memo: {},
          interval: [0, v.values.length - 1],
          state: 'start',
        },
        ['solve(0,n-1)'],
      ),
    ];
  function solve(i: number, j: number): number {
    const key = `${i},${j}`;
    if (j - i + 1 < 3) {
      memo[key] = 0;
      frames.push(
        f(`Base (${key})`, 'Fewer than three vertices: store 0 before memo lookup.', {
          variant: 'triangulation',
          values: v.values,
          memo: { ...memo },
          interval: [i, j],
          state: 'base',
        }),
      );
      return 0;
    }
    if (key in memo) {
      frames.push(
        f(`Memo hit (${key})`, `Reuse ${memo[key]}.`, {
          variant: 'triangulation',
          values: v.values,
          memo: { ...memo },
          interval: [i, j],
          state: 'memo',
        }),
      );
      return memo[key];
    }
    for (let k = i + 1; k < j; k++) {
      const score = v.values[i] * v.values[k] * v.values[j] + solve(i, k) + solve(k, j);
      memo[key] = memo[key] === undefined ? score : Math.min(memo[key], score);
      frames.push(
        f(`Try triangle (${i},${k},${j})`, `Candidate score ${score}; best so far ${memo[key]}.`, {
          variant: 'triangulation',
          values: v.values,
          memo: { ...memo },
          interval: [i, j],
          candidate: k,
          state: 'best',
        }),
      );
    }
    frames.push(
      f(`Complete (${key})`, `Return ${memo[key]}.`, {
        variant: 'triangulation',
        values: v.values,
        memo: { ...memo },
        interval: [i, j],
        state: 'complete',
      }),
    );
    return memo[key];
  }
  const result = solve(0, v.values.length - 1);
  frames.push(
    f(
      'Return root score',
      `Minimum score ${result}; any drawn triangulation is explanatory reconstruction.`,
      { variant: 'triangulation', values: v.values, memo: { ...memo }, state: 'root' },
    ),
  );
  return frames;
}

export const presets = (items: any[], source: any = 'Diagnostic') =>
  items.map(([label, input]: any) => ({ label, input, source }));
