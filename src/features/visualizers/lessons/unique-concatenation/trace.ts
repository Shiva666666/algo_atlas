import { U } from './reference';
export { U } from './reference';
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

export function uniqueFrames(v: any) {
  const frames: VisualFrame<LessonFrameData>[] = [];
  function walk(i: number, word: string) {
    let best = word.length;
    const used = new Set(word);
    frames.push(
      f(
        `Call backtrack(${i}, "${word}")`,
        `temp=${best}; current letters: ${[...used].join(' ') || 'empty'}.`,
        { variant: 'unique', arr: v.arr, word, used: [...used], i, best },
        ['temp = len(word)'],
      ),
    );
    for (let j = i + 1; j < v.arr.length; j++) {
      const c = v.arr[j],
        ok = new Set(c).size === c.length,
        dis = [...used].every((x) => !c.includes(x));
      frames.push(
        f(
          `Check arr[${j}] = "${c}"`,
          ok
            ? dis
              ? 'Unique and disjoint; recurse.'
              : 'Unique, but overlaps the current word.'
            : 'Repeated character; disjoint check is not evaluated.',
          {
            variant: 'unique',
            arr: v.arr,
            word,
            used: [...used],
            candidate: j,
            unique: ok,
            disjoint: ok ? dis : null,
          },
          ['if len(set(arr[j])) == len(arr[j])'],
        ),
      );
      if (ok && dis) best = Math.max(best, walk(j, word + c));
    }
    return best;
  }
  const result = walk(-1, '');
  frames.push(
    f(
      'Return final length',
      `Root returns ${result}. The written i == len(arr) guard is unreachable for this call graph.`,
      { variant: 'unique', arr: v.arr, result },
    ),
  );
  return frames;
}

export const presets = (items: any[], source: any = 'Diagnostic') =>
  items.map(([label, input]: any) => ({ label, input, source }));
