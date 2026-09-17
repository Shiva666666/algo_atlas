import type { GridInput } from './types';
export type { GridInput } from './types';
import type { Problem } from '../../../../shared/contracts/index';

import type {
  GridDpView,
  InsightModel,
  IntuitionFrameData,
  RuleFocus,
  VisualFrame,
} from '../../core/types';

export const insights: InsightModel = {
  state: 'dp[row][col] is the minimum sum from this cell to any cell in the last row.',
  base: 'On the last row there is nowhere left to fall, so dp[last][col] = matrix[last][col].',
  choice: 'Choose down-left, down, or down-right—only when that column exists.',
  invariant: 'Every child row is fully solved before a parent cell reads from it.',
};

export function rules(active: string): RuleFocus[] {
  return [
    { token: 'row == last', meaning: 'return the cell value', active: active === 'base' },
    { token: '(r+1,c-1)', meaning: 'down-left if in bounds', active: active === 'choice' },
    { token: '(r+1,c)', meaning: 'down', active: active === 'choice' },
    { token: '(r+1,c+1)', meaning: 'down-right if in bounds', active: active === 'choice' },
    { token: 'min(children)', meaning: 'best continuation', active: active === 'transition' },
  ];
}

export function parseInput(raw: string): GridInput {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Use {"matrix":[[2,1,3],[6,5,4],[7,8,9]]}.');
  }
  const matrix = Array.isArray(value) ? value : (value as { matrix?: unknown })?.matrix;
  if (
    !Array.isArray(matrix) ||
    !matrix.length ||
    !matrix.every(
      (row) =>
        Array.isArray(row) &&
        row.length === matrix[0].length &&
        row.every((item) => Number.isFinite(Number(item))),
    )
  )
    throw new Error('matrix must be a non-empty rectangular numeric grid.');
  if (matrix.length > 6 || matrix[0].length > 6)
    throw new Error('Use at most a 6 × 6 grid for a readable trace.');
  return { matrix: matrix.map((row) => (row as unknown[]).map(Number)) };
}

export function clone(dp: Array<Array<number | null>>) {
  return dp.map((row) => [...row]);
}

export function frame(
  phase: string,
  title: string,
  message: string,
  view: GridDpView,
  active: string,
): VisualFrame<IntuitionFrameData> {
  return {
    phase,
    title,
    message,
    kind: 'intuition',
    data: {
      variant: 'grid-dp',
      insights,
      rules: rules(active),
      gridDp: {
        ...view,
        storage: 'rolling-row',
        grid: view.grid.map((row) => [...row]),
        dp: clone(view.dp),
        choices: view.choices.map((choice) => ({ ...choice })),
      },
    } satisfies IntuitionFrameData,
  };
}

export function createFrames(value: unknown, _problem: Problem): VisualFrame<IntuitionFrameData>[] {
  const { matrix } = value as GridInput;
  const rows = matrix.length;
  const columns = matrix[0].length;
  const dp: Array<Array<number | null>> = Array.from({ length: rows }, () =>
    Array<number | null>(columns).fill(null),
  );
  const frames: VisualFrame<IntuitionFrameData>[] = [];
  frames.push(
    frame(
      'STATE',
      'Choose what one cell should answer',
      'Once dp[row][col] has this meaning, the final answer is simply the minimum cell in the top row.',
      { grid: matrix, dp, active: null, choices: [], chosen: null },
      'transition',
    ),
  );
  for (let column = 0; column < columns; column += 1)
    dp[rows - 1][column] = matrix[rows - 1][column];
  frames.push(
    frame(
      'BASE',
      'Seed the last row',
      'A path starting on the last row contains only that cell.',
      { grid: matrix, dp, active: [rows - 1, 0], choices: [], chosen: null },
      'base',
    ),
  );
  for (let row = rows - 2; row >= 0; row -= 1) {
    for (let column = 0; column < columns; column += 1) {
      const choices = [] as Array<{ row: number; column: number; value: number }>;
      for (
        let nextColumn = Math.max(0, column - 1);
        nextColumn <= Math.min(columns - 1, column + 1);
        nextColumn += 1
      )
        choices.push({ row: row + 1, column: nextColumn, value: dp[row + 1][nextColumn]! });
      const chosen = choices.reduce((best, item) => (item.value < best.value ? item : best));
      frames.push(
        frame(
          'CHOICE',
          `Inspect children of [${row}, ${column}]`,
          'The boundary removes nonexistent diagonals; no sentinel pointer is needed in the visual state.',
          { grid: matrix, dp, active: [row, column], choices, chosen: [chosen.row, chosen.column] },
          'choice',
        ),
      );
      dp[row][column] = matrix[row][column] + chosen.value;
      frames.push(
        frame(
          'TRANSITION',
          `Resolve dp[${row}][${column}]`,
          `Cell ${matrix[row][column]} + best child ${chosen.value} = ${dp[row][column]}.`,
          { grid: matrix, dp, active: [row, column], choices, chosen: [chosen.row, chosen.column] },
          'transition',
        ),
      );
    }
  }
  const answer = Math.min(...dp[0].map((item) => item!));
  const answerColumn = dp[0].findIndex((item) => item === answer);
  frames.push(
    frame(
      'COMPLETE',
      'Take the best top-row start',
      `The minimum falling path sum is ${answer}.`,
      { grid: matrix, dp, active: [0, answerColumn], choices: [], chosen: null },
      'transition',
    ),
  );
  return frames;
}
