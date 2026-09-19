import source from './reference.py?raw';
import type { VisualFrame } from '../../core/types';
import { addFrame, parseObject, rectangularGrid } from '../../core/trace';
import type { DiagramState, WorkbenchCell } from '../../core/traversal';
import type { Cell, FarmlandData, FarmlandInput } from './types';
export const farmlandCode = source.trimEnd();
const cellKey = ([r, c]: Cell) => `${r},${c}`;

export function parseFarmlandInput(raw: string): FarmlandInput {
  const { land } = parseObject(raw);
  const grid = rectangularGrid(land, 'land', 8, 10, (entry) => entry === 0 || entry === 1);
  const visited = new Set<string>();
  for (let sr = 0; sr < grid.length; sr++)
    for (let sc = 0; sc < grid[0].length; sc++)
      if (grid[sr][sc] === 1 && !visited.has(`${sr},${sc}`)) {
        const queue: Cell[] = [[sr, sc]];
        visited.add(`${sr},${sc}`);
        const cells: Cell[] = [];
        for (let head = 0; head < queue.length; head++) {
          const [r, c] = queue[head];
          cells.push([r, c]);
          for (const [dr, dc] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const nr = r + dr,
              nc = c + dc,
              k = `${nr},${nc}`;
            if (grid[nr]?.[nc] === 1 && !visited.has(k)) {
              visited.add(k);
              queue.push([nr, nc]);
            }
          }
        }
        const rows = cells.map(([r]) => r),
          cols = cells.map(([, c]) => c),
          minR = Math.min(...rows),
          maxR = Math.max(...rows),
          minC = Math.min(...cols),
          maxC = Math.max(...cols);
        for (let r = minR; r <= maxR; r++)
          for (let c = minC; c <= maxC; c++)
            if (grid[r][c] !== 1)
              throw new Error('Every farmland component must fill one rectangle.');
      }
  return { land: grid };
}

export function createFarmlandFrames(value: unknown): VisualFrame<FarmlandData>[] {
  const { land } = parseFarmlandInput(JSON.stringify(value));
  const frames: VisualFrame<FarmlandData>[] = [],
    queue: Cell[] = [],
    groups: number[][] = [];
  const seen = new Set<string>();
  let scan: Cell | null = null,
    current: Cell | null = null,
    bounds: [number, number, number, number] | null = null,
    result: number[][] | null = null,
    action = 'initialize';
  const cells = (): WorkbenchCell[][] =>
    land.map((row, r) =>
      row.map((value, c) => {
        const k = `${r},${c}`;
        let state: DiagramState = value ? 'idle' : 'blocked',
          note = value ? 'farmland' : 'empty';
        if (seen.has(k)) {
          state = 'seen';
          note = 'visited';
        }
        if (queue.some(([qr, qc]) => qr === r && qc === c)) {
          state = 'frontier';
          note = 'queued';
        }
        if (bounds && r >= bounds[0] && r <= bounds[2] && c >= bounds[1] && c <= bounds[3])
          note = value ? 'in bounds' : 'bounds';
        if (scan && scan[0] === r && scan[1] === c) {
          state = 'candidate';
          note = 'scan';
        }
        if (current && current[0] === r && current[1] === c) {
          state = 'active';
          note = 'current';
        }
        if (
          result &&
          groups.some(([a, b, d, e]) => r >= a && r <= d && c >= b && c <= e && value)
        ) {
          state = 'success';
          note = 'group';
        }
        return { value, state, note };
      }),
    );
  const state = (): FarmlandData => ({
    land: land.map((r) => [...r]),
    scan: scan ? ([...scan] as Cell) : null,
    queue: queue.map((c) => [...c] as Cell),
    seen: [...seen],
    current: current ? ([...current] as Cell) : null,
    bounds: bounds ? [...bounds] : null,
    groups: groups.map((g) => [...g]),
    action,
    result: result ? result.map((g) => [...g]) : null,
    heading: 'A farmland group is a rectangle—not necessarily a square',
    summary:
      'BFS discovers the group; independent maximum row and column locate its bottom-right corner.',
    legend: [
      { symbol: '0', label: 'Empty', color: '#778394' },
      { symbol: 'Q', label: 'Queued', color: '#9b8cff' },
      { symbol: '→', label: 'Current', color: '#37d9ff' },
      { symbol: '□', label: 'Completed rectangle', color: '#4fd1a1' },
    ],
    grid: { cells: cells(), label: 'Farmland scan and active rectangle' },
    frontier: {
      label: 'Component frontier',
      kind: 'queue',
      items: queue.map((c, i) => ({
        id: `${i}-${cellKey(c)}`,
        primary: `(${c.join(', ')})`,
        secondary: i === 0 ? 'next' : 'waiting',
        state: i === 0 ? 'active' : 'frontier',
      })),
    },
    metrics: [
      { label: 'Outer scan', value: scan ? `(${scan.join(', ')})` : '—' },
      { label: 'Current cell', value: current ? `(${current.join(', ')})` : '—' },
      { label: 'Top-left', value: bounds ? `(${bounds[0]}, ${bounds[1]})` : '—' },
      { label: 'Bottom-right', value: bounds ? `(${bounds[2]}, ${bounds[3]})` : '—' },
    ],
    equation: bounds ? `max row = ${bounds[2]}, max col = ${bounds[3]}` : 'coordinatewise extrema',
    results: groups.map((g, i) => ({
      label: `Group ${i + 1}`,
      value: `[${g.join(', ')}]`,
      state: 'success',
    })),
  });
  const emit = (phase: string, title: string, message: string, snippet: string, options = {}) => {
    action = phase;
    addFrame(frames, farmlandCode, 'farmland', state(), phase, title, message, snippet, options);
  };
  emit(
    'initialize',
    'Start with no visited farmland',
    'The input grid remains unchanged; seen records processed farmland cells.',
    'seen = set()',
  );
  const directions: Cell[] = [
    [-1, 0],
    [0, -1],
    [1, 0],
    [0, 1],
  ];
  const bfs = (start: Cell): Cell => {
    queue.push([...start] as Cell);
    bounds = [start[0], start[1], start[0], start[1]];
    emit(
      'component-start',
      `Start rectangle at (${start.join(', ')})`,
      'Row-major scanning makes this component seed its top-left corner.',
      'queue = deque([start])',
    );
    while (queue.length) {
      const popped = queue.shift()!;
      current = [...popped] as Cell;
      emit(
        'dequeue',
        `Pop (${current.join(', ')})`,
        'The popped coordinate—not the original seed—is the cell being processed.',
        'row, col = queue.popleft()',
        {
          mistakeCheckpoint: {
            title: 'The seed and current cell are different state',
            submitted: 'seen.add(node)',
            invariant: 'BFS must mark the coordinate it just removed from the queue.',
            correction: 'seen.add((row, col))',
          },
        },
      );
      if (seen.has(cellKey(current))) {
        emit(
          'duplicate',
          'Skip an already processed queue entry',
          'Mark-on-pop permits duplicate frontier entries; the guard keeps the result correct.',
          'if (row, col) in seen:',
        );
        continue;
      }
      seen.add(cellKey(current));
      emit(
        'mark',
        `Mark (${current.join(', ')}) seen`,
        'This is the exact cell removed from the queue.',
        'seen.add((row, col))',
      );
      bounds = [
        bounds[0],
        bounds[1],
        Math.max(bounds[2], current[0]),
        Math.max(bounds[3], current[1]),
      ];
      emit(
        'bounds',
        `Extend bounds to (${bounds[2]}, ${bounds[3]})`,
        'Maximum row and maximum column advance independently, so 1×N and N×1 rectangles work.',
        'max_row = max(max_row, row)',
        {
          mistakeCheckpoint: {
            title: 'Track each coordinate independently',
            submitted: 'row > old_row and row + col >= sum(old)',
            invariant:
              'The bottom-right corner is (max visited row, max visited column). A one-row rectangle must still extend right.',
            correction: 'max_row=max(max_row,row); max_col=max(max_col,col)',
          },
        },
      );
      for (const [dr, dc] of directions) {
        const nr = current[0] + dr,
          nc = current[1] + dc;
        if (
          nr >= 0 &&
          nr < land.length &&
          nc >= 0 &&
          nc < land[0].length &&
          !seen.has(`${nr},${nc}`) &&
          land[nr][nc] === 1
        ) {
          queue.push([nr, nc]);
          emit(
            'enqueue',
            `Queue farmland (${nr}, ${nc})`,
            'Only orthogonally adjacent farmland belongs to this group.',
            'queue.append((nr, nc))',
          );
        }
      }
    }
    current = null;
    return [bounds[2], bounds[3]];
  };
  for (let r = 0; r < land.length; r++)
    for (let c = 0; c < land[0].length; c++) {
      scan = [r, c];
      emit(
        'scan',
        `Scan (${r}, ${c})`,
        land[r][c] === 1 && !seen.has(`${r},${c}`)
          ? 'This is the top-left of an unseen group.'
          : 'Skip empty or previously visited land.',
        'if land[row][col] == 1 and (row, col) not in seen:',
      );
      if (land[r][c] === 1 && !seen.has(`${r},${c}`)) {
        const [endR, endC] = bfs([r, c]);
        groups.push([r, c, endR, endC]);
        emit(
          'record',
          `Record [${r}, ${c}, ${endR}, ${endC}]`,
          'The rectangle is complete before the outer scan continues.',
          'result.append([row, col, end_row, end_col])',
        );
      }
    }
  scan = null;
  bounds = null;
  result = groups.map((g) => [...g]);
  emit(
    'result',
    `Return ${groups.length} group${groups.length === 1 ? '' : 's'}`,
    'Every farmland cell belongs to exactly one recorded rectangle.',
    'return result',
  );
  return frames;
}
