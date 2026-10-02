import source from './reference.py?raw';
import { addFrame, parseObject } from '../../core/trace';
import type { VisualFrame } from '../../core/types';
import type { DepthData, DepthInput } from './types';
export const depthCode = source.trimEnd();
export function parseDepthInput(raw: string): DepthInput {
  const { s } = parseObject(raw);
  if (typeof s !== 'string' || s.length < 1 || s.length > 64 || !/^[0-9+*/()\-]+$/.test(s))
    throw new Error('s must contain 1–64 digits, +, −, *, /, or parentheses.');
  let depth = 0;
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth < 0)
      throw new Error('Parentheses must be balanced; a closing parenthesis has no opening match.');
  }
  if (depth !== 0)
    throw new Error('Parentheses must be balanced; an opening parenthesis has no closing match.');
  return { s };
}
export function createDepthFrames(value: unknown): VisualFrame<DepthData>[] {
  const { s } = parseDepthInput(JSON.stringify(value));
  const frames: VisualFrame<DepthData>[] = [];
  const opens: Array<{ start: number; level: number }> = [];
  const ranges: DepthData['ranges'] = [];
  let i = 0,
    localDepth = 0,
    maximum = 0,
    result: number | null = null;
  const emit = (action: string, title: string, equation: string, line: string) =>
    addFrame(
      frames,
      depthCode,
      'maximum-nesting-depth',
      { s, i, localDepth, maximum, ranges, result, action, equation },
      action === 'result' ? 'RESULT' : 'SCAN',
      title,
      equation,
      line,
    );
  emit('initialize', 'Start with depth zero', 'loc_depth = 0; depth = 0', 'loc_depth = 0');
  while (i < s.length) {
    emit(
      'inspect',
      `Read character ${i}: ${s[i]}`,
      s[i] === '('
        ? 'Opening parenthesis: increase current depth.'
        : s[i] === ')'
          ? 'Closing parenthesis: record the maximum before decreasing current depth.'
          : 'This character leaves both depth counters unchanged.',
      'if s[i] == "(":',
    );
    if (s[i] === '(') {
      const old = localDepth;
      localDepth++;
      opens.push({ start: i, level: localDepth });
      emit('open', 'Enter one nesting level', `${old} + 1 = ${localDepth}`, 'loc_depth += 1');
    } else if (s[i] === ')') {
      const old = maximum;
      maximum = Math.max(localDepth, maximum);
      emit(
        'maximum',
        'Record depth before leaving the level',
        `max(${localDepth}, ${old}) = ${maximum}`,
        'depth = max(loc_depth, depth)',
      );
      const opening = opens.pop()!;
      ranges.push({ ...opening, end: i });
      const oldLocal = localDepth;
      localDepth--;
      emit('close', 'Leave one nesting level', `${oldLocal} − 1 = ${localDepth}`, 'loc_depth -= 1');
    } else
      emit(
        'ignore',
        'Arithmetic and digits do not change depth',
        `loc_depth = ${localDepth}; depth = ${maximum}`,
        'elif s[i] == ")":',
      );
    i++;
    emit('advance', 'Advance the character pointer', `i = ${i}`, 'i += 1');
  }
  result = maximum;
  emit('result', 'Return the maximum nesting depth', `depth = ${maximum}`, 'return depth');
  return frames;
}
