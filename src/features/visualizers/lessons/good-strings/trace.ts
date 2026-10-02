import source from './reference.py?raw';
import { addFrame, integer, parseObject } from '../../core/trace';
import type { VisualFrame } from '../../core/types';
import type { MemoCallSnapshot } from '../../core/memoized-recursion-types';
import type { GoodStringsInput, GoodStringsData } from './types';
export const goodStringsCode = source.trimEnd();
export function parseGoodStringsInput(raw: string): GoodStringsInput {
  const p = parseObject(raw),
    low = integer(p.low, 'low', 1, 24),
    high = integer(p.high, 'high', low, 24);
  return { low, high, zero: integer(p.zero, 'zero', 1, low), one: integer(p.one, 'one', 1, low) };
}
export function createGoodStringsFrames(value: unknown): VisualFrame<GoodStringsData>[] {
  const input = parseGoodStringsInput(JSON.stringify(value)),
    { low, high, zero, one } = input;
  const memo: Array<number | null> = Array(high + 1).fill(null),
    calls: MemoCallSnapshot[] = [],
    frames: VisualFrame<GoodStringsData>[] = [];
  let id = 0,
    result: number | null = null,
    returned: number | null = null;
  const emit = (
    action: string,
    title: string,
    equation: string,
    line: string,
    message = equation,
  ) => {
    addFrame(
      frames,
      goodStringsCode,
      'good-strings',
      { ...input, memo, calls, action, equation, result, returned },
      'LENGTH STATES',
      title,
      message,
      line,
    );
    if (action === 'return')
      frames.at(-1)!.codeLines = [
        goodStringsCode.split('\n').findLastIndex((l) => l.trim() === line) + 1,
      ];
  };
  memo[high] = 1;
  emit(
    'seed',
    'At the upper bound, stopping is the one valid choice',
    `memo[${high}] = 1`,
    'memo = {high:1}',
  );
  function topdown(length: number): number {
    const call: MemoCallSnapshot = {
      id: id++,
      argument: length,
      best: null,
      choice: null,
      children: [],
    };
    calls.push(call);
    returned = null;
    emit(
      'overflow-guard',
      'Check the upper bound',
      `${length} > ${high}: ${length > high}`,
      'if length > high:',
    );
    if (length > high) {
      returned = 0;
      emit(
        'overflow',
        'This appended block overshoots',
        'return 0; do not memoize the overflow state.',
        'return 0',
      );
      calls.pop();
      return 0;
    }
    emit(
      'lookup',
      'Check the length memo',
      `${length} in memo: ${memo[length] !== null}`,
      'if length in memo:',
    );
    if (memo[length] !== null) {
      returned = memo[length];
      emit(
        'hit',
        'Reuse the continuation count',
        `return memo[${length}] = ${returned}`,
        'return memo[length]',
      );
      calls.pop();
      return returned;
    }
    call.best = length < low ? 0 : 1;
    emit(
      'stop',
      'Count stopping here when the length is valid',
      `val = ${call.best} (${length} ${length < low ? '<' : '≥'} ${low})`,
      'val = 0 if length < low else 1',
    );
    call.children = [
      { label: `append ${zero} zeros`, target: length + zero, result: null },
      { label: `append ${one} ones`, target: length + one, result: null },
    ];
    for (let branch = 0; branch < 2; branch++) {
      call.choice = branch;
      emit(
        'call',
        branch === 0 ? 'Recurse through the zero block' : 'Recurse through the one block',
        `${call.children[branch].label}: topdown(${call.children[branch].target})`,
        'val += (topdown(length + zero) + topdown(length + one))',
        zero === one
          ? 'Equal block lengths share a memo destination, but zero and one are distinct string choices.'
          : 'The two branches are evaluated left to right, before adding to val.',
      );
      const child = topdown(call.children[branch].target);
      call.children[branch].result = child;
      returned = child;
      emit(
        'child-return',
        'Keep this child return in its own slot',
        `${call.children[branch].label} returned ${child}`,
        'val += (topdown(length + zero) + topdown(length + one))',
      );
    }
    const stopping = call.best;
    call.best += call.children[0].result! + call.children[1].result!;
    emit(
      'add',
      'Add both branch counts and the stopping contribution',
      `${stopping} + ${call.children[0].result} + ${call.children[1].result} = ${call.best}`,
      'val += (topdown(length + zero) + topdown(length + one))',
    );
    memo[length] = call.best % 1000000007;
    emit(
      'write',
      'Store the count modulo 1,000,000,007',
      `${call.best} mod 1,000,000,007 = ${memo[length]}`,
      'memo[length] = val % (10**9 + 7)',
    );
    returned = memo[length];
    emit(
      'return',
      'Return this memoized length count',
      `return ${returned}`,
      'return memo[length]',
    );
    calls.pop();
    return returned;
  }
  result = topdown(0);
  emit(
    'result',
    'Return all good strings from the empty start',
    `topdown(0) = ${result}`,
    'return topdown(0)',
  );
  return frames;
}
