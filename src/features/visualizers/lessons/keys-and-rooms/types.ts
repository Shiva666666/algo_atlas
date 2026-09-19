import type { TraversalLessonData } from '../../core/traversal';

export interface KeysRoomsInput {
  rooms: number[][];
}
export interface KeysRoomsData extends TraversalLessonData {
  rooms: number[][];
  queue: number[];
  seen: number[];
  processed: number[];
  currentRoom: number | null;
  currentKey: number | null;
  action: string;
  result: boolean | null;
}
