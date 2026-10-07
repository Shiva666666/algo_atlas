import source from './reference.py?raw';
import type { FillInput, FillData } from './types';
import type { VisualFrame } from '../../core/types';
import { parseObject, integer, rectangularGrid } from '../../core/trace';
import { referenceWriter } from '../../core/reference-trace';
export const referenceCode = source.trimEnd();
export function parseInput(raw: string): FillInput {
  const value = parseObject(raw);
  const image = rectangularGrid(
    value.image,
    'image',
    8,
    10,
    (v) => Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= 9,
  );
  return {
    image,
    sr: integer(value.sr, 'sr', 0, image.length - 1),
    sc: integer(value.sc, 'sc', 0, image[0].length - 1),
    color: integer(value.color, 'color', 0, 9),
  };
}
export function createFrames(value: unknown) {
  const input = parseInput(JSON.stringify(value));
  const frames: VisualFrame<FillData>[] = [];
  const d: FillData = {
    ...input,
    original: structuredClone(input.image),
    change: input.image[input.sr][input.sc],
    queue: [],
    seen: [],
    active: null,
    candidate: null,
    direction: null,
    checks: [],
    processed: 0,
    changed: 0,
    result: null,
    action: '',
    equation: '',
  };
  const emit = referenceWriter(referenceCode, 'flood-fill', d, frames);
  const directions = [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
  ];
  const names = ['right', 'down', 'up', 'left'];
  let nextId = 0;
  const seen = new Set<string>();
  emit('initialize', 'm = ' + d.image.length, 'm = len(image)', 'Record row count.');
  emit('initialize', 'n = ' + d.image[0].length, 'n = len(image[0])', 'Record column count.');
  emit(
    'initialize',
    'right → down → up → left',
    'directions = [(0,1),(1,0),(-1,0),(0,-1)]',
    'Preserve the screenshot’s neighbor order.',
  );
  emit(
    'initialize',
    'Original color · change = ' + d.change,
    'change = image[sr][sc]',
    'Capture this before any recoloring.',
  );
  emit(
    'initialize',
    'queue = deque()',
    'queue = deque()',
    'FIFO entries have distinct teaching IDs, even when their coordinates duplicate.',
  );
  d.queue.push({ id: nextId++, row: d.sr, col: d.sc });
  emit(
    'enqueue',
    'Enqueue start (' + d.sr + ', ' + d.sc + ')',
    'queue.append((sr,sc))',
    'The start is not marked seen yet.',
  );
  emit(
    'initialize',
    'seen = set()',
    'seen = set()',
    'The saved implementation marks on dequeue, not on enqueue.',
  );
  while (d.queue.length) {
    d.candidate = null;
    d.direction = null;
    d.checks = [];
    emit(
      'check',
      'Queue contains ' + d.queue.length + ' entries',
      'while queue:',
      'Remove the oldest queue entry next.',
    );
    d.active = d.queue.shift()!;
    const { row, col } = d.active;
    emit(
      'dequeue',
      'Dequeue #' + d.active.id + ' · (' + row + ', ' + col + ')',
      'row, col = queue.popleft()',
      'Other entries for the same coordinate may still be waiting.',
    );
    const duplicate = seen.has(row + ',' + col);
    emit(
      'check',
      duplicate ? 'Already seen · skip' : 'Not seen · process',
      'if (row, col) in seen:',
      'Duplicate entries must not be processed twice.',
    );
    if (duplicate) {
      emit(
        'skip',
        'Skip duplicate entry #' + d.active.id,
        'continue',
        'No recoloring or neighbor exploration occurs for this queue entry.',
      );
      continue;
    }
    if (d.image[row][col] !== d.color) d.changed++;
    d.image[row][col] = d.color;
    emit(
      'recolor',
      'image[' + row + '][' + col + '] = ' + d.color,
      'image[row][col] = color',
      'Assign the target color even when it equals the original color.',
    );
    seen.add(row + ',' + col);
    d.seen.push([row, col]);
    d.processed++;
    emit(
      'mark',
      'Mark (' + row + ', ' + col + ') seen',
      'seen.add((row,col))',
      'Seen prevents repeated processing. Changed pixels and processed pixels are different counts.',
    );
    for (let dir = 0; dir < 4; dir++) {
      d.direction = dir;
      const nr = row + directions[dir][0],
        nc = col + directions[dir][1];
      d.candidate = [nr, nc];
      d.checks = [];
      emit(
        'neighbor',
        'Try ' + names[dir] + ' · (' + nr + ', ' + nc + ')',
        'nr, nc = row + dr, col + dc',
        'Calculate this neighbor without mutating the grid.',
      );
      let allowed = true;
      const tests = [
        () => nr >= 0 && nr < d.image.length,
        () => nc >= 0 && nc < d.image[0].length,
        () => d.image[nr][nc] === d.change,
        () => !seen.has(nr + ',' + nc),
      ];
      d.checks = tests.map((fn, i) => {
        const value = allowed ? fn() : null;
        if (value === false) allowed = false;
        return {
          term: [
            'Row in bounds',
            'Column in bounds',
            'Current pixel = original color',
            'Not in seen',
          ][i],
          value,
        };
      });
      emit(
        'compare',
        allowed ? 'Neighbor qualifies' : 'Neighbor rejected',
        'if 0<=nr<m and 0<=nc<n and image[nr][nc] == change and (nr,nc) not in seen:',
        'Read predicates left to right; later terms are not evaluated after a false term.',
      );
      if (allowed) {
        d.queue.push({ id: nextId++, row: nr, col: nc });
        emit(
          'enqueue',
          'Enqueue (' + nr + ', ' + nc + ')',
          'queue.append((nr, nc))',
          'An unseen cell already waiting in the queue may be enqueued again.',
        );
      }
    }
  }
  d.candidate = null;
  d.direction = null;
  d.result = structuredClone(d.image);
  emit(
    'result',
    'Return recolored image',
    'return image',
    'Only the four-connected component of the original start color is processed.',
  );
  return frames;
}
