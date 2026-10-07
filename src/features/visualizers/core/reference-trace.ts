import type { VisualFrame } from './types';
/** Exact occurrence mapping supports repeated pop/return lines without ambiguous highlighting. */
export function referenceWriter<D extends { action: string; equation: string }>(
  code: string,
  kind: string,
  data: D,
  frames: VisualFrame<D>[],
) {
  return (
    action: string,
    equation: string,
    snippet: string,
    message: string,
    occurrence = 0,
    phase = action,
  ) => {
    const lines = code
      .split('\n')
      .flatMap((line, i) => (line.trim() === snippet.trim() ? [i + 1] : []));
    if (lines[occurrence] === undefined)
      throw new Error('Missing reference occurrence: ' + snippet);
    data.action = action;
    data.equation = equation;
    frames.push({
      kind,
      phase,
      title: equation,
      message,
      codeFocus: [snippet],
      codeLines: [lines[occurrence]],
      data: structuredClone(data),
    });
  };
}
export function bracketString(value: unknown, allowed: RegExp, minimum = 1): string {
  if (
    typeof value !== 'string' ||
    value.length < minimum ||
    value.length > 32 ||
    !allowed.test(value)
  )
    throw new Error('Enter ' + minimum + '–32 characters using only the permitted brackets.');
  return value;
}
