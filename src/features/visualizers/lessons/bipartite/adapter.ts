import type { IntuitionFrameData, VisualizerAdapter } from '../../core/types';
import { parseInput, createFrames } from './trace';

import { lessonPresets } from './presets';
export const bipartiteVisualizer: VisualizerAdapter<unknown, IntuitionFrameData> = {
  id: 'is-graph-bipartite',
  name: 'Disconnected BFS + two-color invariant',
  mode: 'specialized',
  description:
    'Watch components seed, queue entries expand, and each edge preserve or break the two-color invariant.',
  inputLabel: 'GRAPH PARAMETER · adjacency list',
  placeholder: '{"graph":[[1,3],[0,2],[1,3],[0,2]]}',
  presets: lessonPresets,
  parseInput,
  createFrames,
};
export * from './trace';
