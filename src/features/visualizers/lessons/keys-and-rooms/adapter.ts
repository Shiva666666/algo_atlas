import type { VisualizerAdapter } from '../../core/types';
import { keysRoomsPresets } from './presets';
import { createKeysRoomsFrames, keysRoomsCode, parseKeysRoomsInput } from './trace';
import type { KeysRoomsData } from './types';

export const keysRoomsVisualizer: VisualizerAdapter<unknown, KeysRoomsData> = {
  id: 'keys-and-rooms',
  name: 'Directed Key Reachability',
  mode: 'specialized',
  presentation: 'diagram-first',
  description: 'Follow the BFS frontier as keys unlock rooms in a directed graph.',
  inputLabel: 'Rooms and their keys',
  inputGuide: 'Use 2–12 arrays. Every key must be a valid room index and unique within its room.',
  placeholder: '{"rooms":[[1],[2],[3],[]]}',
  referenceCode: keysRoomsCode,
  parseInput: parseKeysRoomsInput,
  createFrames: createKeysRoomsFrames,
  presets: keysRoomsPresets,
};
export * from './trace';
