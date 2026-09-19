import source from './reference.py?raw';
import type { VisualFrame } from '../../core/types';
import { addFrame, parseObject, rectangularGrid } from '../../core/trace';
import type { DiagramState, WorkbenchCell } from '../../core/traversal';
import type { Cell, MaximumFishData, MaximumFishInput } from './types';

export const maximumFishCode = source.trimEnd();
const key = (row: number, column: number) => `${row},${column}`;

export function parseMaximumFishInput(raw: string): MaximumFishInput {
  const { grid } = parseObject(raw);
  return {
    grid: rectangularGrid(
      grid,
      'grid',
      10,
      10,
      (entry) => Number.isInteger(entry) && Number(entry) >= 0,
    ).map((row) => row.map(Number)),
  };
}

export function createMaximumFishFrames(value: unknown): VisualFrame<MaximumFishData>[] {
  const { grid } = parseMaximumFishInput(JSON.stringify(value));
  const frames: VisualFrame<MaximumFishData>[] = [];
  const seen = new Set<string>();
  const stack: Cell[] = [];
  const pondTotals: number[] = [];
  let current: Cell | null = null;
  let subtotal = 0;
  let result: number | null = null;
  let action = 'initialize';
  const board = (): WorkbenchCell[][] =>
    grid.map((row, r) =>
      row.map((fish, c) => {
        let state: DiagramState = fish === 0 ? 'blocked' : 'idle';
        let note = fish === 0 ? 'dry' : `${fish} fish`;
        if (seen.has(key(r, c))) {
          state = 'seen';
          note = 'collected';
        }
        if (stack.some(([sr, sc]) => sr === r && sc === c)) {
          state = 'frontier';
          note = 'DFS call';
        }
        if (current?.[0] === r && current[1] === c) {
          state = 'active';
          note = 'current';
        }
        return { value: fish, state, note };
      }),
    );
  const state = (): MaximumFishData => ({
    inputGrid: grid.map((row) => [...row]),
    seen: [...seen],
    stack: stack.map((cell) => [...cell] as Cell),
    current: current ? ([...current] as Cell) : null,
    subtotal,
    pondTotals: [...pondTotals],
    result,
    action,
    heading: 'Each DFS return carries a pond subtotal',
    summary:
      'Positive orthogonal neighbors belong to the same pond; zero cells and diagonals stop the traversal.',
    legend: [
      { symbol: '0', label: 'Dry', color: '#778394' },
      { symbol: '→', label: 'Current', color: '#37d9ff' },
      { symbol: '✓', label: 'Collected', color: '#4fd1a1' },
    ],
    grid: { cells: board(), label: 'Weighted pond grid' },
    frontier: {
      label: 'Recursive calls',
      kind: 'stack',
      items: stack.map((cell, index) => ({
        id: `${index}-${key(...cell)}`,
        primary: `(${cell.join(', ')})`,
        secondary: index === stack.length - 1 ? 'active call' : 'parent',
        state: index === stack.length - 1 ? 'active' : 'frontier',
      })),
    },
    metrics: [
      { label: 'Current cell', value: current ? `(${current.join(', ')})` : '—' },
      { label: 'Current subtotal', value: String(subtotal) },
      { label: 'Completed ponds', value: String(pondTotals.length) },
      { label: 'Best total', value: String(result ?? Math.max(0, ...pondTotals)) },
    ],
    equation: current
      ? `subtotal includes ${grid[current[0]][current[1]]} at (${current.join(', ')})`
      : 'sum one connected component',
    results: pondTotals.map((total, index) => ({
      label: `Pond ${index + 1}`,
      value: `${total} fish`,
      state: 'success',
    })),
  });
  const emit = (phase: string, title: string, message: string, snippet: string) => {
    action = phase;
    addFrame(frames, maximumFishCode, 'maximum-fish', state(), phase, title, message, snippet);
  };
  emit(
    'initialize',
    'Start with no collected water cells',
    'The scan may begin from any positive cell.',
    'seen = set()',
  );
  const dfs = (row: number, column: number): number => {
    current = [row, column];
    stack.push([row, column]);
    seen.add(key(row, column));
    subtotal = grid[row][column];
    emit(
      'enter',
      `Enter (${row}, ${column}) with ${subtotal} fish`,
      'This cell contributes before any recursive children return.',
      'subtotal = grid[row][column]',
    );
    let local = grid[row][column];
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const nr = row + dr,
        nc = column + dc;
      if (
        nr >= 0 &&
        nr < grid.length &&
        nc >= 0 &&
        nc < grid[0].length &&
        grid[nr][nc] > 0 &&
        !seen.has(key(nr, nc))
      ) {
        emit(
          'inspect',
          `Inspect water neighbor (${nr}, ${nc})`,
          'A positive unvisited orthogonal neighbor belongs to this pond.',
          'if 0 <= nr < rows and 0 <= nc < columns and grid[nr][nc] > 0 and (nr, nc) not in seen:',
        );
        const child = dfs(nr, nc);
        current = [row, column];
        local += child;
        subtotal = local;
        emit(
          'return-child',
          `Add child subtotal ${child}`,
          `The call at (${row}, ${column}) now carries ${local} fish.`,
          'subtotal += dfs(nr, nc)',
        );
      }
    }
    stack.pop();
    current = stack.at(-1) ? ([...stack.at(-1)!] as Cell) : null;
    subtotal = local;
    emit(
      'return',
      `Return ${local} from (${row}, ${column})`,
      'Only one connected pond is included in this return value.',
      'return subtotal',
    );
    return local;
  };
  for (let row = 0; row < grid.length; row++)
    for (let column = 0; column < grid[0].length; column++) {
      if (grid[row][column] > 0 && !seen.has(key(row, column))) {
        const total = dfs(row, column);
        pondTotals.push(total);
        result = Math.max(result ?? 0, total);
        emit(
          'pond-complete',
          `Pond total: ${total}`,
          'Compare this completed component with the global maximum.',
          'answer = max(answer, dfs(row, column))',
        );
      }
    }
  result = Math.max(0, ...pondTotals);
  current = null;
  subtotal = 0;
  emit(
    'result',
    `Maximum fish = ${result}`,
    'Disconnected ponds are compared, never combined.',
    'return answer',
  );
  return frames;
}
