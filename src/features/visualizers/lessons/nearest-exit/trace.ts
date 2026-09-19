import source from './reference.py?raw';
import type { VisualFrame } from '../../core/types';
import { addFrame, parseObject } from '../../core/trace';
import type { DiagramState, WorkbenchCell } from '../../core/traversal';
import type { Cell, NearestExitData, NearestExitInput } from './types';

export const nearestExitCode = source.trimEnd();
const key = ([r, c]: Cell) => `${r},${c}`;

export function parseNearestExitInput(raw: string): NearestExitInput {
  const value = parseObject(raw);
  if (!Array.isArray(value.maze) || value.maze.length < 1 || value.maze.length > 8)
    throw new Error('maze must contain 1–8 rows.');
  const rows = value.maze.map((row) => (Array.isArray(row) ? row.join('') : row));
  if (!rows.every((row) => typeof row === 'string'))
    throw new Error('Maze rows must be strings or character arrays.');
  const maze = rows as string[];
  const columns = maze[0].length;
  if (
    columns < 1 ||
    columns > 10 ||
    !maze.every((row) => row.length === columns && /^[+.]+$/.test(row))
  )
    throw new Error('Use a rectangular maze of + walls and . openings, at most 8×10.');
  if (
    !Array.isArray(value.entrance) ||
    value.entrance.length !== 2 ||
    !value.entrance.every(Number.isInteger)
  )
    throw new Error('entrance must be [row, column].');
  const entrance = value.entrance as Cell;
  if (
    entrance[0] < 0 ||
    entrance[0] >= maze.length ||
    entrance[1] < 0 ||
    entrance[1] >= columns ||
    maze[entrance[0]][entrance[1]] !== '.'
  )
    throw new Error('entrance must identify an open maze cell.');
  return { maze: [...maze], entrance: [...entrance] as Cell };
}

export function createNearestExitFrames(value: unknown): VisualFrame<NearestExitData>[] {
  const { maze, entrance } = parseNearestExitInput(JSON.stringify(value));
  const frames: VisualFrame<NearestExitData>[] = [];
  const queue: Array<[number, number, number]> = [[entrance[0], entrance[1], 0]];
  const seen = new Set([key(entrance)]);
  const parent = new Map<string, string | null>([[key(entrance), null]]);
  let current: Cell | null = null,
    candidate: Cell | null = null,
    distance: number | null = null,
    result: number | null = null,
    path: Cell[] = [],
    action = 'initialize';
  const exits = new Set<string>();
  for (let r = 0; r < maze.length; r++)
    for (let c = 0; c < maze[0].length; c++)
      if (
        maze[r][c] === '.' &&
        (r === 0 || c === 0 || r === maze.length - 1 || c === maze[0].length - 1) &&
        key([r, c]) !== key(entrance)
      )
        exits.add(`${r},${c}`);
  const cells = (): WorkbenchCell[][] =>
    maze.map((row, r) =>
      [...row].map((value, c) => {
        const cellKey = `${r},${c}`;
        let state: DiagramState = value === '+' ? 'blocked' : 'idle';
        let note = value === '+' ? 'wall' : exits.has(cellKey) ? 'exit' : '';
        if (seen.has(cellKey)) {
          state = 'seen';
          note = 'seen';
        }
        if (queue.some(([qr, qc]) => qr === r && qc === c)) {
          state = 'frontier';
          note = 'queued';
        }
        if (candidate && candidate[0] === r && candidate[1] === c) {
          state = 'candidate';
          note = 'test';
        }
        if (current && current[0] === r && current[1] === c) {
          state = 'active';
          note = `d=${distance}`;
        }
        if (path.some(([pr, pc]) => pr === r && pc === c)) {
          state = 'success';
          note =
            cellKey === key(entrance)
              ? 'entrance'
              : cellKey === key(path.at(-1)!)
                ? 'nearest exit'
                : 'path';
        }
        if (cellKey === key(entrance) && !path.length) note = 'entrance';
        return { value: cellKey === key(entrance) ? 'E' : value, state, note };
      }),
    );
  const state = (): NearestExitData => ({
    maze: [...maze],
    entrance: [...entrance] as Cell,
    queue: queue.map((item) => [...item] as [number, number, number]),
    seen: [...seen],
    current: current ? ([...current] as Cell) : null,
    candidate: candidate ? ([...candidate] as Cell) : null,
    distance,
    path: path.map((cell) => [...cell] as Cell),
    action,
    result,
    heading: 'BFS expands one distance layer at a time',
    summary:
      'The first valid border cell removed from the queue is the nearest exit; the entrance never qualifies.',
    legend: [
      { symbol: '+', label: 'Wall', color: '#778394' },
      { symbol: 'Q', label: 'Frontier', color: '#9b8cff' },
      { symbol: '→', label: 'Current', color: '#37d9ff' },
      { symbol: '✓', label: 'Shortest path', color: '#4fd1a1' },
    ],
    grid: { cells: cells(), label: 'Maze BFS state' },
    frontier: {
      label: 'BFS frontier',
      kind: 'queue',
      items: queue.map(([r, c, d], index) => ({
        id: `${index}-${r}-${c}`,
        primary: `(${r}, ${c})`,
        secondary: `distance ${d}`,
        state: index === 0 ? 'active' : 'frontier',
      })),
    },
    metrics: [
      { label: 'Current cell', value: current ? `(${current.join(', ')})` : '—' },
      { label: 'Distance', value: distance === null ? '—' : String(distance) },
      { label: 'Candidate', value: candidate ? `(${candidate.join(', ')})` : '—' },
      { label: 'Result', value: result === null ? 'pending' : String(result) },
    ],
    equation: current
      ? `distance(${current.join(',')}) = ${distance}`
      : 'queue distances never decrease',
    results: path.length
      ? [
          {
            label: 'Nearest path',
            value: path.map((cell) => `(${cell.join(',')})`).join(' → '),
            state: 'success',
          },
        ]
      : [],
  });
  const emit = (phase: string, title: string, message: string, snippet: string, options = {}) => {
    action = phase;
    addFrame(
      frames,
      nearestExitCode,
      'nearest-exit',
      state(),
      phase,
      title,
      message,
      snippet,
      options,
    );
  };
  emit(
    'initialize',
    'Start at distance 0',
    'The entrance is discovered immediately so it cannot be queued again.',
    'queue = deque([(entrance[0], entrance[1], 0)])',
  );
  const directions: Cell[] = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  while (queue.length) {
    const [r, c, d] = queue.shift()!;
    current = [r, c];
    distance = d;
    candidate = null;
    emit(
      'dequeue',
      `Visit (${r}, ${c}) at distance ${d}`,
      'Every queued cell at a smaller distance has already been processed.',
      'row, col, distance = queue.popleft()',
    );
    const border = r === 0 || c === 0 || r === maze.length - 1 || c === maze[0].length - 1;
    emit(
      'exit-check',
      border && key(current) !== key(entrance)
        ? 'This is the nearest exit'
        : border
          ? 'Border cell, but it is the entrance'
          : 'Not on the border',
      'Test the current popped cell once, before inspecting neighbors.',
      'if on_border and [row, col] != entrance:',
    );
    if (border && key(current) !== key(entrance)) {
      result = d;
      const reverse: Cell[] = [];
      let cursor: string | null = key(current);
      while (cursor) {
        reverse.push(cursor.split(',').map(Number) as Cell);
        cursor = parent.get(cursor) ?? null;
      }
      path = reverse.reverse();
      emit(
        'result',
        `Return ${d}`,
        'BFS guarantees that no undiscovered exit can be closer.',
        'return distance',
      );
      return frames;
    }
    for (const [dr, dc] of directions) {
      const nr = r + dr,
        nc = c + dc;
      candidate = [nr, nc];
      const valid =
        nr >= 0 &&
        nr < maze.length &&
        nc >= 0 &&
        nc < maze[0].length &&
        maze[nr][nc] === '.' &&
        !seen.has(`${nr},${nc}`);
      emit(
        'neighbor',
        valid ? `Discover (${nr}, ${nc})` : `Reject (${nr}, ${nc})`,
        valid
          ? 'This open, unseen neighbor joins the next BFS layer.'
          : 'The candidate is outside, blocked, or already discovered.',
        'if 0 <= nr < len(maze) and 0 <= nc < len(maze[0]) and maze[nr][nc] == "." and (nr, nc) not in seen:',
      );
      if (valid) {
        seen.add(`${nr},${nc}`);
        parent.set(`${nr},${nc}`, `${r},${c}`);
        emit(
          'discover',
          `Mark (${nr}, ${nc}) discovered`,
          'Mark before enqueueing to prevent duplicate frontier entries.',
          'seen.add((nr, nc))',
        );
        queue.push([nr, nc, d + 1]);
        emit(
          'enqueue',
          `Queue distance ${d + 1}`,
          'The wavefront remains ordered by distance.',
          'queue.append((nr, nc, distance + 1))',
        );
      }
    }
  }
  current = null;
  candidate = null;
  distance = null;
  result = -1;
  emit(
    'result',
    'No exit is reachable',
    'The queue is empty and every reachable opening was processed.',
    'return -1',
  );
  return frames;
}
