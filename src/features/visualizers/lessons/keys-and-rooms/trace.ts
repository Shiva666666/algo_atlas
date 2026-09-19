import source from './reference.py?raw';
import type { VisualFrame } from '../../core/types';
import { addFrame, parseObject } from '../../core/trace';
import type { DiagramState, WorkbenchEdge, WorkbenchNode } from '../../core/traversal';
import type { KeysRoomsData, KeysRoomsInput } from './types';

export const keysRoomsCode = source.trimEnd();

export function parseKeysRoomsInput(raw: string): KeysRoomsInput {
  const { rooms } = parseObject(raw);
  if (!Array.isArray(rooms) || rooms.length < 2 || rooms.length > 12)
    throw new Error('rooms must contain 2–12 room lists.');
  if (!rooms.every((keys) => Array.isArray(keys)))
    throw new Error('Every room must contain a key list.');
  const n = rooms.length;
  const copy = rooms.map((keys, room) => {
    if (!keys.every((key) => Number.isInteger(key) && key >= 0 && key < n))
      throw new Error(`Room ${room} contains a key outside 0–${n - 1}.`);
    if (new Set(keys).size !== keys.length)
      throw new Error(`Room ${room} contains duplicate keys.`);
    return [...keys] as number[];
  });
  return { rooms: copy };
}

function diagram(
  rooms: number[][],
  queue: number[],
  seen: Set<number>,
  processed: Set<number>,
  currentRoom: number | null,
  currentKey: number | null,
) {
  const nodes: WorkbenchNode[] = rooms.map((_, id) => {
    let state: DiagramState = 'blocked';
    if (processed.has(id)) state = 'seen';
    if (seen.has(id)) state = queue.includes(id) ? 'frontier' : 'seen';
    if (id === currentKey) state = 'candidate';
    if (id === currentRoom) state = 'active';
    return {
      id,
      label: String(id),
      detail: id === 0 ? 'starts unlocked' : seen.has(id) ? 'unlocked' : 'locked',
      state,
    };
  });
  const edges: WorkbenchEdge[] = rooms.flatMap((keys, room) =>
    keys.map((key) => ({
      from: room,
      to: key,
      directed: true,
      state: room === currentRoom && key === currentKey ? ('active' as const) : ('idle' as const),
    })),
  );
  return { nodes, edges, label: 'Directed room-to-key graph' };
}

export function createKeysRoomsFrames(value: unknown): VisualFrame<KeysRoomsData>[] {
  const { rooms } = parseKeysRoomsInput(JSON.stringify(value));
  const frames: VisualFrame<KeysRoomsData>[] = [];
  const queue = [0];
  const seen = new Set([0]);
  const processed = new Set<number>();
  let currentRoom: number | null = null;
  let currentKey: number | null = null;
  let action = 'initialize';
  let result: boolean | null = null;
  const state = (): KeysRoomsData => ({
    rooms,
    queue: [...queue],
    seen: [...seen],
    processed: [...processed],
    currentRoom,
    currentKey,
    action,
    result,
    heading: 'Keys unlock a directed reachability graph',
    summary:
      'A key opens its numbered room. Seeing a key is discovery; leaving the queue is processing.',
    legend: [
      { symbol: '0', label: 'Locked', color: '#778394' },
      { symbol: 'Q', label: 'Queued', color: '#9b8cff' },
      { symbol: '→', label: 'Current', color: '#37d9ff' },
      { symbol: '✓', label: 'Visited', color: '#4fd1a1' },
    ],
    graph: diagram(rooms, queue, seen, processed, currentRoom, currentKey),
    frontier: {
      label: 'Rooms waiting to open',
      kind: 'queue',
      items: queue.map((room, index) => ({
        id: `${index}-${room}`,
        primary: `room ${room}`,
        secondary: index === 0 ? 'next' : `position ${index + 1}`,
        state: index === 0 ? 'active' : 'frontier',
      })),
    },
    metrics: [
      { label: 'Current room', value: currentRoom === null ? '—' : String(currentRoom) },
      { label: 'Key inspected', value: currentKey === null ? '—' : String(currentKey) },
      { label: 'Unlocked rooms', value: `${seen.size} / ${rooms.length}` },
      { label: 'Result', value: result === null ? 'pending' : String(result) },
    ],
    results: [...processed].map((room) => ({
      label: `Room ${room}`,
      value: 'keys collected',
      state: 'success',
    })),
  });
  const emit = (phase: string, title: string, message: string, snippet: string, options = {}) => {
    action = phase;
    addFrame(
      frames,
      keysRoomsCode,
      'keys-and-rooms',
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
    'Room 0 starts unlocked',
    'Put room 0 in the queue and mark it discovered immediately.',
    'queue = deque([0])',
  );
  emit(
    'initialize',
    'Discovery starts with room 0',
    'Marking on enqueue guarantees that a room enters the queue at most once.',
    'seen = {0}',
  );
  while (queue.length) {
    currentRoom = queue.shift()!;
    currentKey = null;
    emit(
      'dequeue',
      `Open room ${currentRoom}`,
      'Remove the oldest unlocked room and collect every key inside it.',
      'room = queue.popleft()',
    );
    for (const key of rooms[currentRoom]) {
      currentKey = key;
      emit(
        'inspect',
        `Inspect key ${key}`,
        seen.has(key)
          ? 'This room is already unlocked, so do not queue it again.'
          : 'This key discovers a new room.',
        'for key in rooms[room]:',
      );
      emit(
        'membership',
        seen.has(key) ? `Room ${key} is already known` : `Room ${key} is newly unlocked`,
        'The seen set is the discovered set, not only the processed set.',
        'if key not in seen:',
      );
      if (!seen.has(key)) {
        seen.add(key);
        emit(
          'discover',
          `Mark room ${key} discovered`,
          'Record discovery before enqueueing to prevent duplicate frontier entries.',
          'seen.add(key)',
        );
        queue.push(key);
        emit(
          'enqueue',
          `Queue room ${key}`,
          'It will be opened after every room already waiting.',
          'queue.append(key)',
        );
      }
    }
    processed.add(currentRoom);
  }
  currentRoom = null;
  currentKey = null;
  result = seen.size === rooms.length;
  emit(
    'result',
    result ? 'Every room is reachable' : 'Some rooms remain locked',
    `${seen.size} of ${rooms.length} rooms were unlocked from room 0.`,
    'return len(seen) == len(rooms)',
  );
  return frames;
}
