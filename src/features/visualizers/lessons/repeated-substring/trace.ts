import type { RepeatedData } from './types';
export type { RepeatedData } from './types';
import repeatedSource from './reference.py?raw';

import type { VisualFrame } from '../../core/types';

export const repeatedSubstringCode = repeatedSource.trimEnd();

export function objectInput(raw: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Enter valid JSON before building steps.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Enter a JSON object with the named input field.');
  return value as Record<string, unknown>;
}

export function parseRepeatedInput(raw: string): { s: string } {
  const { s } = objectInput(raw);
  if (typeof s !== 'string' || !/^[a-z]{1,32}$/.test(s))
    throw new Error('s must contain 1–32 lowercase ASCII letters, with no spaces.');
  return { s };
}

export function frameWriter<T>(
  code: string,
  kind: VisualFrame['kind'],
  state: T,
  frames: VisualFrame<T>[],
) {
  const lines = code.split('\n');
  return (phase: string, title: string, message: string, snippet: string) => {
    const index = lines.findIndex((line) => line.trim() === snippet);
    if (index < 0) throw new Error('Missing reference line: ' + snippet);
    frames.push({
      kind,
      phase,
      title,
      message,
      codeFocus: [snippet],
      codeLines: [index + 1],
      data: structuredClone(state),
    });
  };
}

export function createRepeatedFrames(value: unknown): VisualFrame<RepeatedData>[] {
  const { s } = parseRepeatedInput(JSON.stringify(value));
  const frames: VisualFrame<RepeatedData>[] = [];
  const state: RepeatedData = {
    s,
    n: s.length,
    length: null,
    remainder: null,
    copies: null,
    prefix: '',
    built: '',
    candidates: Array.from({ length: Math.floor(s.length / 2) }, (_, i) => ({
      length: i + 1,
      status: 'untested',
    })),
    mismatches: [],
    comparison: null,
    result: null,
    action: 'initialize',
  };
  const write = frameWriter(repeatedSubstringCode, 'repeated-substring', state, frames);
  const emit = (action: string, title: string, message: string, line: string) => {
    state.action = action;
    write(action, title, message, line);
  };
  emit(
    'initialize',
    'Can one proper prefix tile the string?',
    'A repeated prefix needs at least two copies, so candidate lengths stop at floor(n / 2).',
    'n = len( s )',
  );
  for (let length = 1; length <= Math.floor(s.length / 2); length++) {
    Object.assign(state, {
      length,
      remainder: null,
      copies: null,
      prefix: '',
      built: '',
      mismatches: [],
      comparison: null,
    });
    state.candidates[length - 1].status = 'testing';
    emit(
      'candidate',
      'Try prefix length ' + length,
      'Test lengths in ascending order, exactly as the saved loop does.',
      'for length in range( 1, n//2 + 1):',
    );
    state.remainder = s.length % length;
    if (state.remainder !== 0) state.candidates[length - 1].status = 'non-divisor';
    emit(
      'divisibility',
      s.length + ' % ' + length + ' = ' + state.remainder,
      state.remainder
        ? 'A partial block would remain. Skip this length without constructing a prefix.'
        : 'The length divides n; this candidate can fill the whole string.',
      'if (n % length) == 0:',
    );
    if (state.remainder !== 0) continue;
    state.prefix = s.slice(0, length);
    emit(
      'prefix',
      'Take prefix “' + state.prefix + '”',
      'The candidate is the first length characters, not an arbitrary substring.',
      'sub = s[ : length]',
    );
    state.copies = s.length / length;
    state.built = state.prefix.repeat(state.copies);
    emit(
      'construct',
      'Repeat the prefix ' + state.copies + ' times',
      'Align the reconstructed string beneath the original before comparing them.',
      'if sub*(n//length) == s:',
    );
    state.mismatches = Array.from(s).flatMap((char, i) => (char === state.built[i] ? [] : [i]));
    state.comparison = state.mismatches.length === 0;
    state.candidates[length - 1].status = state.comparison ? 'successful' : 'mismatch';
    emit(
      'comparison',
      state.comparison ? 'Every position matches' : 'This candidate does not match',
      state.comparison
        ? 'The entire string is made of identical prefix blocks.'
        : 'Highlighted positions explain the single string equality operation; they are not extra Python loop steps.',
      'if sub*(n//length) == s:',
    );
    if (state.comparison) {
      state.result = true;
      emit(
        'result',
        'Return True',
        'A matching proper prefix was found. Later lengths are not tested.',
        'return True',
      );
      return frames;
    }
  }
  state.result = false;
  emit(
    'result',
    'Return False',
    state.n === 1
      ? 'A single character cannot contain multiple copies of a nonempty proper prefix.'
      : 'Every candidate length was skipped or reconstructed a different string.',
    'return False',
  );
  return frames;
}
