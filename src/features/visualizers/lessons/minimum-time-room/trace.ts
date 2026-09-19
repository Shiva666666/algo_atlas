import source from './reference.py?raw';
import type { VisualFrame } from '../../core/types';
import { addFrame, parseObject, rectangularGrid } from '../../core/trace';
import type { DiagramState, WorkbenchCell } from '../../core/traversal';
import type { Cell, HeapItem, MinimumTimeData, MinimumTimeInput } from './types';

export const minimumTimeCode = source.trimEnd();
const key = (r: number, c: number) => `${r},${c}`;
export function parseMinimumTimeInput(raw: string): MinimumTimeInput {
  const { moveTime } = parseObject(raw);
  return {
    moveTime: rectangularGrid(
      moveTime,
      'moveTime',
      8,
      8,
      (entry) => Number.isInteger(entry) && Number(entry) >= 0,
    ).map((row) => row.map(Number)),
  };
}
export function createMinimumTimeFrames(value: unknown): VisualFrame<MinimumTimeData>[] {
  const { moveTime } = parseMinimumTimeInput(JSON.stringify(value));
  const rows = moveTime.length,
    columns = moveTime[0].length;
  const best = Array.from({ length: rows }, () => Array<number>(columns).fill(Infinity));
  best[0][0] = 0;
  const heap: HeapItem[] = [{ time: 0, row: 0, column: 0, serial: 0 }];
  const finalized = new Set<string>();
  const frames: VisualFrame<MinimumTimeData>[] = [];
  let serial = 1,
    current: Cell | null = null,
    candidate: Cell | null = null,
    wait = 0,
    duration: number | null = null,
    result: number | null = null,
    action = 'initialize';
  const sortedHeap = () =>
    [...heap].sort(
      (a, b) => a.time - b.time || a.row - b.row || a.column - b.column || a.serial - b.serial,
    );
  const board = (): WorkbenchCell[][] =>
    moveTime.map((row, r) =>
      row.map((gate, c) => {
        let state: DiagramState = best[r][c] < Infinity ? 'seen' : 'idle';
        let note = best[r][c] < Infinity ? `best ${best[r][c]}` : `gate ${gate}`;
        if (heap.some((item) => item.row === r && item.column === c && item.time === best[r][c])) {
          state = 'frontier';
          note = `queued ${best[r][c]}`;
        }
        if (finalized.has(key(r, c))) {
          state = 'success';
          note = `final ${best[r][c]}`;
        }
        if (candidate?.[0] === r && candidate[1] === c) {
          state = 'candidate';
          note = `gate ${gate}`;
        }
        if (current?.[0] === r && current[1] === c) {
          state = 'active';
          note = `time ${best[r][c]}`;
        }
        return { value: gate, state, note };
      }),
    );
  const state = (): MinimumTimeData => ({
    moveTime: moveTime.map((row) => [...row]),
    best: best.map((row) => row.map((time) => (Number.isFinite(time) ? time : null))),
    heap: sortedHeap().map((item) => ({ ...item })),
    finalized: [...finalized],
    current: current ? ([...current] as Cell) : null,
    candidate: candidate ? ([...candidate] as Cell) : null,
    wait,
    duration,
    result,
    action,
    heading: 'Dijkstra separates waiting time from alternating move cost',
    summary:
      'A room gate controls when movement may start; move duration is 1, then 2, then 1, based on path parity.',
    legend: [
      { symbol: 'H', label: 'In min-heap', color: '#9b8cff' },
      { symbol: '→', label: 'Popped', color: '#37d9ff' },
      { symbol: '✓', label: 'Finalized', color: '#4fd1a1' },
      { symbol: '?', label: 'Candidate', color: '#ffbf4a' },
    ],
    grid: { cells: board(), label: 'Room gates; notes show best arrival times' },
    frontier: {
      label: 'Arrival-time frontier',
      kind: 'min-heap',
      items: sortedHeap().map((item) => ({
        id: String(item.serial),
        primary: `${item.time} · (${item.row}, ${item.column})`,
        secondary: item.time === best[item.row][item.column] ? 'live' : 'stale',
        state: item.time === best[item.row][item.column] ? 'frontier' : 'rejected',
      })),
    },
    metrics: [
      { label: 'Current room', value: current ? `(${current.join(', ')})` : '—' },
      { label: 'Candidate room', value: candidate ? `(${candidate.join(', ')})` : '—' },
      { label: 'Wait', value: String(wait) },
      { label: 'Move duration', value: duration === null ? '—' : String(duration) },
    ],
    equation:
      current && candidate && duration !== null
        ? `max(${best[current[0]][current[1]]}, ${moveTime[candidate[0]][candidate[1]]}) + ${duration}`
        : 'best[0][0] = 0',
    results:
      result === null
        ? []
        : [{ label: 'Minimum arrival', value: String(result), state: 'success' }],
  });
  const emit = (
    phase: string,
    title: string,
    message: string,
    snippet: string,
    checkpoint?: Parameters<typeof addFrame<MinimumTimeData>>[8],
  ) => {
    action = phase;
    addFrame(
      frames,
      minimumTimeCode,
      'minimum-time-room',
      state(),
      phase,
      title,
      message,
      snippet,
      checkpoint,
    );
  };
  emit(
    'initialize',
    'Start in room (0, 0) at time 0',
    'The gate printed in the start room does not delay the initial position.',
    'best[0][0] = 0',
    {
      mistakeCheckpoint: {
        title: 'The start gate is not an arrival constraint',
        submitted: 'start_time = moveTime[0][0]',
        invariant: 'You already occupy (0, 0) at time 0.',
        correction: 'best[0][0] = 0',
      },
    },
  );
  while (heap.length) {
    heap.sort(
      (a, b) => a.time - b.time || a.row - b.row || a.column - b.column || a.serial - b.serial,
    );
    const item = heap.shift()!;
    current = [item.row, item.column];
    candidate = null;
    wait = 0;
    duration = (item.row + item.column) % 2 === 0 ? 1 : 2;
    emit(
      'pop',
      `Pop (${item.row}, ${item.column}) at ${item.time}`,
      'Only the smallest live arrival can finalize a room.',
      'current_time, row, column = heapq.heappop(heap)',
    );
    if (item.time !== best[item.row][item.column]) {
      emit(
        'stale',
        'Skip stale heap entry',
        'A shorter arrival was pushed after this item.',
        'if current_time != best[row][column]:',
      );
      continue;
    }
    finalized.add(key(item.row, item.column));
    if (item.row === rows - 1 && item.column === columns - 1) {
      result = item.time;
      emit(
        'result',
        `Destination finalized at ${result}`,
        'Returning when popped—not when first discovered—preserves Dijkstra’s guarantee.',
        'return current_time',
        {
          mistakeCheckpoint: {
            title: 'Discovery is not finalization',
            submitted: 'return when destination is pushed',
            invariant: 'Another heap route may still reach the destination earlier.',
            correction: 'return when destination is popped with its live best time',
          },
        },
      );
      break;
    }
    emit(
      'duration',
      `Next move costs ${duration}`,
      `Every path to (${item.row}, ${item.column}) has the same move-count parity.`,
      'duration = 1 if (row + column) % 2 == 0 else 2',
      {
        mistakeCheckpoint: {
          title: 'Duration follows move number, not direction',
          submitted: 'duration = 1 or 2 from wall/direction',
          invariant: 'Move costs alternate 1, 2, 1, 2 regardless of which neighbor is chosen.',
          correction: 'duration = 1 if (row + column) % 2 == 0 else 2',
        },
      },
    );
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const nr = item.row + dr,
        nc = item.column + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= columns) continue;
      candidate = [nr, nc];
      wait = Math.max(0, moveTime[nr][nc] - item.time);
      const arrival = Math.max(item.time, moveTime[nr][nc]) + duration;
      emit(
        'inspect',
        `Try (${nr}, ${nc}): arrive ${arrival}`,
        wait
          ? `Wait ${wait}, then spend ${duration} moving.`
          : `No waiting; spend ${duration} moving.`,
        'arrival = max(current_time, moveTime[nr][nc]) + duration',
        {
          mistakeCheckpoint: {
            title: 'Wait first, then add the move duration',
            submitted: 'max(current_time + duration, moveTime[next])',
            invariant: 'The gate controls when the move can begin, not when it must end.',
            correction: 'max(current_time, moveTime[next]) + duration',
          },
        },
      );
      if (arrival < best[nr][nc]) {
        best[nr][nc] = arrival;
        heap.push({ time: arrival, row: nr, column: nc, serial: serial++ });
        emit(
          'relax',
          `Improve (${nr}, ${nc}) to ${arrival}`,
          'Push a stable heap item; an older entry may remain but will become stale.',
          'heapq.heappush(heap, (arrival, nr, nc))',
        );
      }
    }
  }
  if (result === null) {
    result = -1;
    emit(
      'result',
      'Destination is unreachable',
      'The frontier emptied before finalizing the destination.',
      'return -1',
    );
  }
  return frames;
}
