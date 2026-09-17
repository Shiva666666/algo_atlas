import type { Cell, IslandCall, IslandData } from './types';
export type { Cell, IslandCall, IslandData } from './types';
import islandSource from './reference.py?raw';

import type { VisualFrame } from '../../core/types';

export const maxAreaIslandCode = islandSource.trimEnd();

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

export function parseIslandInput(raw: string): { grid: number[][] } {
  const { grid } = objectInput(raw);
  if (
    !Array.isArray(grid) ||
    grid.length < 1 ||
    grid.length > 10 ||
    !Array.isArray(grid[0]) ||
    grid[0].length < 1 ||
    grid[0].length > 13
  )
    throw new Error('grid must have 1–10 rows and 1–13 columns.');
  const columns = grid[0].length;
  if (
    !grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === columns &&
        row.every((cell) => cell === 0 || cell === 1),
    )
  )
    throw new Error('Use a rectangular grid containing only numeric 0 and 1.');
  return { grid: grid.map((row) => [...row]) };
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

export const islandDirections: ReadonlyArray<readonly [number, number, string]> = [
  [0, 1, 'Right'],
  [1, 0, 'Down'],
  [0, -1, 'Left'],
  [-1, 0, 'Up'],
];

export function createIslandFrames(value: unknown): VisualFrame<IslandData>[] {
  const { grid } = parseIslandInput(JSON.stringify(value));
  const frames: VisualFrame<IslandData>[] = [];
  let callId = 0;
  const state: IslandData = {
    grid,
    scan: null,
    seen: [],
    stack: [],
    active: null,
    action: 'initialize',
    neighbor: null,
    returned: null,
    addition: null,
    islands: [],
    islandId: 0,
    currentCells: [],
    maxArea: 0,
    result: null,
  };
  const seen = new Set<string>();
  const write = frameWriter(maxAreaIslandCode, 'island-dfs', state, frames);
  const emit = (action: string, title: string, message: string, line: string) => {
    state.action = action;
    state.active = state.stack.at(-1)?.cell ?? null;
    write(
      state.stack.length ? 'DFS traversal' : action === 'result' ? 'Result' : 'Outer scan',
      title,
      message,
      line,
    );
  };
  emit(
    'directions',
    'Explore right, down, left, up',
    'Only orthogonal neighbors connect an island. Diagonal contact does not count.',
    'directions = [(0 , 1),(1 , 0),(0 , -1),(-1 , 0)]',
  );
  emit(
    'initialize',
    'Start with no visited land',
    'The seen set prevents land from being counted twice. Water is not inserted.',
    'seen = set()',
  );
  emit(
    'max-init',
    'Start the maximum at zero',
    'The maximum changes only after a whole starting DFS call returns.',
    'max_area = 0',
  );
  function dfs(row: number, column: number): number {
    const call: IslandCall = {
      id: ++callId,
      parentId: state.stack.at(-1)?.id ?? null,
      cell: [row, column],
      localArea: null,
      direction: null,
    };
    state.stack.push(call);
    state.neighbor = null;
    state.returned = null;
    state.addition = null;
    emit(
      'call',
      'Enter dfs(' + row + ', ' + column + ')',
      'Each call owns a separate local_area; the parent waits for its return.',
      'def dfs(row, column):',
    );
    emit(
      'water-check',
      grid[row][column] === 0 ? 'Water contributes zero' : 'This cell is land',
      'Check water before marking anything seen.',
      'if grid[row][column] == 0:',
    );
    if (grid[row][column] === 0) {
      state.returned = { callId: call.id, cell: [row, column], value: 0, parentId: call.parentId };
      emit(
        'return',
        'Return 0 from water',
        'No land was counted and this water cell is still absent from seen.',
        'return 0',
      );
      state.stack.pop();
      return 0;
    }
    const key = row + ',' + column;
    seen.add(key);
    state.seen = [...seen];
    state.currentCells.push(key);
    emit(
      'mark',
      'Mark (' + key + ') seen',
      'Mark land before visiting neighbors, preventing recursive cycles and double counting.',
      'seen.add((row, column))',
    );
    call.localArea = 1;
    emit(
      'area-init',
      'Count this land cell',
      'This call starts at one. Child return values will be added as they finish.',
      'local_area = 1',
    );
    for (let direction = 0; direction < 4; direction++) {
      call.direction = direction;
      state.returned = null;
      state.addition = null;
      state.neighbor = null;
      const [dr, dc, label] = islandDirections[direction];
      const nr = row + dr,
        nc = column + dc;
      emit(
        'direction',
        'Try ' + label.toLowerCase(),
        'Keep the saved right → down → left → up direction order.',
        'for r,c in directions:',
      );
      state.neighbor = {
        cell: [nr, nc],
        direction,
        rowInBounds: null,
        columnInBounds: null,
        unseen: null,
        passes: null,
      };
      emit(
        'neighbor',
        'Candidate neighbor (' + nr + ', ' + nc + ')',
        'Compute coordinates before evaluating bounds and seen membership.',
        'new_r, new_c= row+r, column+c',
      );
      const rowOk = nr >= 0 && nr < grid.length;
      const columnOk = rowOk ? nc >= 0 && nc < grid[0].length : null;
      const unseen = columnOk === true ? !seen.has(nr + ',' + nc) : null;
      state.neighbor = {
        cell: [nr, nc],
        direction,
        rowInBounds: rowOk,
        columnInBounds: columnOk,
        unseen,
        passes: unseen === true,
      };
      emit(
        'neighbor-check',
        unseen === true
          ? 'Visit this neighbor'
          : !rowOk || columnOk === false
            ? 'Skip: outside the grid'
            : 'Skip: land already seen',
        unseen === true
          ? 'An in-bounds unseen neighbor is called even if it is water.'
          : 'Later condition terms are not evaluated after an earlier term fails.',
        'if 0<=new_r<len(grid) and 0<=new_c<len(grid[0]) and (new_r, new_c) not in seen:',
      );
      if (unseen === true) {
        const returned: number = dfs(nr, nc);
        const old: number = call.localArea!;
        const total: number = old + returned;
        call.localArea = total;
        state.neighbor = null;
        state.addition = { parentId: call.id, old, child: returned, total };
        emit(
          'accumulate',
          old + ' + ' + returned + ' = ' + call.localArea,
          'Resume the caller and add the child return to this call’s subtotal—not the global maximum.',
          'local_area+= dfs(new_r, new_c)',
        );
      }
    }
    state.neighbor = null;
    state.addition = null;
    state.returned = {
      callId: call.id,
      cell: [row, column],
      value: call.localArea!,
      parentId: call.parentId,
    };
    emit(
      'return',
      'Return area ' + call.localArea,
      'All four neighbor choices have been handled. Pass this subtotal to the caller.',
      'return local_area',
    );
    state.stack.pop();
    return call.localArea!;
  }
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++) {
      state.scan = [r, c];
      state.neighbor = null;
      state.returned = null;
      state.addition = null;
      emit(
        'scan',
        'Scan (' + r + ', ' + c + ')',
        grid[r][c]
          ? 'Land: check whether an earlier DFS already visited it.'
          : 'Water: the outer loop does not start a DFS here.',
        'if grid[r][c] == 1:',
      );
      if (grid[r][c] !== 1) continue;
      emit(
        'seen-check',
        seen.has(r + ',' + c)
          ? 'Already part of a visited island'
          : 'An unvisited island starts here',
        'Only unvisited land starts a new component.',
        'if (r,c) not in seen:',
      );
      if (seen.has(r + ',' + c)) continue;
      state.islandId++;
      state.currentCells = [];
      emit(
        'island-start',
        'Explore island ' + state.islandId,
        'The maximum waits while dfs(r,c) evaluates.',
        'max_area = max(max_area,dfs(r,c))',
      );
      const area = dfs(r, c);
      const oldMax = state.maxArea;
      state.maxArea = Math.max(oldMax, area);
      state.islands.push({
        id: state.islandId,
        root: [r, c],
        area,
        cells: [...state.currentCells],
      });
      emit(
        'island-done',
        'Maximum: max(' + oldMax + ', ' + area + ') = ' + state.maxArea,
        'The starting DFS call has finished; now compare the complete island area.',
        'max_area = max(max_area,dfs(r,c))',
      );
    }
  state.scan = null;
  state.returned = null;
  state.result = state.maxArea;
  emit(
    'result',
    'Return maximum area ' + state.result,
    'Every land cell belongs to exactly one completed island.',
    'return max_area',
  );
  return frames;
}

export const officialIslandGrid = [
  [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0],
  [0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
];
