import source from './reference.py?raw';
import { addFrame, integer, parseObject } from '../../core/trace';
import type { VisualFrame } from '../../core/types';
import type { MemoCallSnapshot } from '../../core/memoized-recursion-types';
import type { SquaresInput, SquaresData } from './types';
export const squaresCode = source.trimEnd();
export function parseSquaresInput(raw: string): SquaresInput {
  return { n: integer(parseObject(raw).n, 'n', 1, 40) };
}
export function createSquaresFrames(value: unknown): VisualFrame<SquaresData>[] {
  const { n } = parseSquaresInput(JSON.stringify(value));
  const frames: VisualFrame<SquaresData>[] = [],
    squares: number[] = [],
    memo: Array<number | null> = Array(n + 1).fill(null),
    calls: MemoCallSnapshot[] = [];
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
      squaresCode,
      'perfect-squares',
      { n, squares, memo, calls, action, equation, result, returned },
      'MEMOIZED RECURSION',
      title,
      message,
      line,
    );
    if (action === 'return')
      frames.at(-1)!.codeLines = [
        squaresCode.split('\n').findLastIndex((l) => l.trim() === line) + 1,
      ];
  };
  emit(
    'generate',
    'Generate square choices',
    `floor(√${n}) = ${Math.floor(Math.sqrt(n))}`,
    'no_of_squares = int(sqrt(n))',
  );
  for (let i = 1; i <= Math.floor(Math.sqrt(n)); i++) squares.push(i * i);
  emit(
    'generate',
    'Squares are in ascending order',
    squares.join(', '),
    'squares = [i**2 for i in range(1, no_of_squares + 1)]',
  );
  emit(
    'initialize',
    'An absent memo entry is unknown',
    'Check membership before reading; missing entries are not zero.',
    'memo = defaultdict(int)',
  );
  for (const square of squares) {
    memo[square] = 1;
    emit('seed', 'A square needs one term', `memo[${square}] = 1`, 'memo[num] = 1');
  }
  function topdown(x: number): number {
    const call: MemoCallSnapshot = {
      id: id++,
      argument: x,
      best: null,
      choice: null,
      children: [],
    };
    calls.push(call);
    returned = null;
    emit('lookup', 'Check memo membership', `${x} in memo: ${memo[x] !== null}`, 'if x in memo:');
    if (memo[x] !== null) {
      returned = memo[x];
      emit('hit', 'Reuse a stored answer', `return memo[${x}] = ${returned}`, 'return memo[x]');
      calls.pop();
      return returned;
    }
    emit(
      'zero-guard',
      'Check the zero base case',
      `${x} == 0: false`,
      'if x == 0:',
      'With all square entries seeded, valid input never calls topdown(0). This guard is checked but its return is not reached.',
    );
    emit('initialize-call', 'Start the local minimum at infinity', 'val = ∞', 'val = float("inf")');
    for (const square of squares) {
      call.choice = square;
      call.children = [];
      emit(
        'guard',
        'Check the next square',
        `${square} > ${x}: ${square > x}`,
        'if squares[i] > x:',
      );
      if (square > x) {
        emit(
          'break',
          'Stop at the first oversized square',
          'All later squares are larger too.',
          'break',
        );
        break;
      }
      call.children = [{ label: `subtract ${square}`, target: x - square, result: null }];
      emit(
        'call',
        'Try a permitted subtraction',
        `topdown(${x} − ${square}) + 1`,
        'val = min(val, topdown(x - squares[i]) + 1)',
      );
      const child = topdown(x - square);
      call.children[0].result = child;
      returned = child;
      emit(
        'child-return',
        'The child returns before the minimum update',
        `1 + ${child} = ${child + 1}`,
        'val = min(val, topdown(x - squares[i]) + 1)',
      );
      const old = call.best;
      call.best = Math.min(old ?? Infinity, child + 1);
      emit(
        'minimum',
        'Update the local minimum',
        `min(${old ?? '∞'}, 1 + ${child}) = ${call.best}`,
        'val = min(val, topdown(x - squares[i]) + 1)',
      );
    }
    memo[x] = call.best!;
    emit('write', 'Store this completed remainder', `memo[${x}] = ${call.best}`, 'memo[x] = val');
    returned = memo[x];
    emit('return', 'Return the stored minimum', `return ${returned}`, 'return memo[x]');
    calls.pop();
    return returned;
  }
  result = topdown(n);
  emit(
    'result',
    'Return the fewest square terms',
    `topdown(${n}) = ${result}`,
    'return topdown(n)',
  );
  return frames;
}
