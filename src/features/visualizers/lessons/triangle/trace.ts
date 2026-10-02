import source from './reference.py?raw';
import { addFrame, integer, parseObject } from '../../core/trace';
import type { VisualFrame } from '../../core/types';
import type { TriangleData, TriangleInput } from './types';
export const triangleCode = source.trimEnd();
export function parseTriangleInput(raw: string): TriangleInput {
  const { triangle } = parseObject(raw);
  if (!Array.isArray(triangle) || triangle.length < 1 || triangle.length > 8)
    throw new Error('triangle must contain 1–8 rows.');
  return {
    triangle: triangle.map((row, r) => {
      if (!Array.isArray(row) || row.length !== r + 1)
        throw new Error(`Row ${r} must contain ${r + 1} values.`);
      return row.map((cell) => integer(cell, 'Triangle value', -10000, 10000));
    }),
  };
}
export function createTriangleFrames(value: unknown): VisualFrame<TriangleData>[] {
  const { triangle } = parseTriangleInput(JSON.stringify(value));
  const frames: VisualFrame<TriangleData>[] = [];
  const dp: Array<Array<number | null>> = triangle.map((row) => row.map(() => null));
  let active: [number, number] | null = null,
    parents: Array<[number, number]> = [],
    result: number | null = null;
  const path: Array<[number, number]> = [];
  const emit = (
    action: string,
    title: string,
    equation: string,
    line: string,
    message = equation,
  ) =>
    addFrame(
      frames,
      triangleCode,
      'triangle',
      { triangle, dp, active, parents, result, path, action, equation },
      action === 'result' ? 'RESULT' : 'DEPENDENCIES',
      title,
      message,
      line,
    );
  emit(
    'initialize',
    'Initialize every cost to infinity',
    'No path cost has been evaluated yet.',
    'dp = [[float("inf")]*len(triangle[i]) for i in range(len(triangle))]',
  );
  dp[0][0] = triangle[0][0];
  active = [0, 0];
  emit('seed', 'Seed the apex', `dp[0][0] = ${triangle[0][0]}`, 'dp[0][0] = triangle[0][0]');
  for (let i = 1; i < triangle.length; i++) {
    active = [i, 0];
    parents = [[i - 1, 0]];
    const leftCost = dp[i - 1][0]! + triangle[i][0];
    emit(
      'compare',
      'The first column has one parent',
      `${dp[i - 1][0]} + ${triangle[i][0]} = ${leftCost}`,
      'dp[i][0] = dp[i-1][0] + triangle[i][0]',
    );
    dp[i][0] = leftCost;
    emit(
      'update',
      'Store the first-column cost',
      `dp[${i}][0] = ${leftCost}`,
      'dp[i][0] = dp[i-1][0] + triangle[i][0]',
    );
    for (let j = 1; j < triangle[i].length; j++)
      for (let x = 0; x < 2; x++) {
        active = [i, j];
        parents = [];
        const p = j - x,
          valid = p < dp[i - 1].length;
        if (valid) parents = [[i - 1, p]];
        emit(
          'guard',
          'Check the parent boundary',
          `${j} − ${x} < ${dp[i - 1].length}: ${valid}`,
          'if j-x < len(dp[i-1]):',
          valid
            ? 'This parent exists in the shorter row above.'
            : 'The same-column parent is outside the row; skip it.',
        );
        if (valid) {
          const candidate = dp[i - 1][p]! + triangle[i][j];
          emit(
            'compare',
            'Compare the candidate before updating',
            `min(${dp[i][j] ?? '∞'}, ${dp[i - 1][p]} + ${triangle[i][j]}) = ${Math.min(dp[i][j] ?? Infinity, candidate)}`,
            'dp[i][j] = min(dp[i][j], dp[i-1][j-x] + triangle[i][j])',
          );
          dp[i][j] = Math.min(dp[i][j] ?? Infinity, candidate);
          emit(
            'update',
            'Store the smaller path cost',
            `dp[${i}][${j}] = ${dp[i][j]}`,
            'dp[i][j] = min(dp[i][j], dp[i-1][j-x] + triangle[i][j])',
          );
        }
      }
  }
  result = Math.min(...dp.at(-1)!.map(Number));
  let c = dp.at(-1)!.indexOf(result);
  for (let r = triangle.length - 1; r >= 0; r--) {
    path.unshift([r, c]);
    if (r > 0) {
      const candidates = [c - 1, c].filter((p) => p >= 0 && p < dp[r - 1].length);
      c = candidates.find((p) => dp[r - 1][p]! + triangle[r][c] === dp[r][c])!;
    }
  }
  active = null;
  parents = [];
  emit(
    'result',
    'Return the bottom-row minimum',
    `min(${dp.at(-1)!.join(', ')}) = ${result}`,
    'return min(dp[-1])',
    'The highlighted path is derived from completed DP costs; the reference stores costs, not predecessors. Ties use the leftmost matching parent for this annotation.',
  );
  return frames;
}
