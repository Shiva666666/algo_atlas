import type { VisualFrame } from './types';

export type TraceEmit = (
  action: string,
  equation: string,
  source: string,
  message: string,
  checkpoint?: boolean,
  phase?: string,
  occurrence?: number,
) => void;

/** Count a complete simulation before allocating any frame snapshots. */
export function completeTrace<D extends { action: string; equation: string }>(
  code: string,
  kind: string,
  initialize: () => D,
  simulate: (data: D, emit: TraceEmit) => void,
  limit = 12000,
): VisualFrame<D>[] {
  const source = code.split('\n');
  const pass = (capture: boolean) => {
    const data = initialize();
    const frames: VisualFrame<D>[] = [];
    let count = 0;
    const emit: TraceEmit = (
      action,
      equation,
      snippet,
      message,
      checkpoint = false,
      phase = 'Trace',
      occurrence = 0,
    ) => {
      if (++count > limit)
        throw new Error('Trace too large: use a smaller input (12,000-step limit).');
      data.action = action;
      data.equation = equation;
      if (!capture) return;
      const matches = source.flatMap((line, i) => (line.trim() === snippet.trim() ? [i + 1] : []));
      const line = matches[occurrence];
      if (line === undefined) throw new Error('Missing reference occurrence: ' + snippet);
      frames.push({
        kind,
        phase,
        title: equation,
        message,
        codeFocus: [snippet],
        codeLines: [line],
        traceRole: checkpoint ? 'checkpoint' : 'transition',
        data: structuredClone(data),
      });
    };
    simulate(data, emit);
    return frames;
  };
  pass(false);
  return pass(true);
}

export function numericArray(
  raw: string,
  maximum: number,
  { maximumValue = 100000, distinct = false }: { maximumValue?: number; distinct?: boolean } = {},
): { nums: number[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Use {"nums":[1,2,1]} or paste a numeric array.');
  }
  const nums = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object'
      ? (parsed as { nums?: unknown }).nums
      : undefined;
  if (!Array.isArray(nums) || nums.length < 1 || nums.length > maximum)
    throw new Error(`Use 1–${maximum} numbers for a complete readable trace.`);
  if (
    !nums.every(
      (n) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 1 && n <= maximumValue,
    )
  )
    throw new Error(
      `Every value must be an integer from 1 through ${maximumValue.toLocaleString('en-US')}.`,
    );
  if (distinct && new Set(nums).size !== nums.length)
    throw new Error('Use distinct values: the position map requires one index per value.');
  return { nums: [...nums] };
}
