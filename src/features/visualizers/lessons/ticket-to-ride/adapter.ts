import type { IntuitionFrameData, VisualizerAdapter } from '../../core/types';
import { parseInput, createFrames } from './trace';

import { lessonPresets } from './presets';
export const ticketToRideVisualizer: VisualizerAdapter<unknown, IntuitionFrameData> = {
  id: 'ticket-to-ride',
  name: 'Tree path vs Steiner branching',
  mode: 'specialized',
  description:
    'Use the actual tree to see why the chosen object is one path, then align road costs and ticket rewards to it.',
  inputLabel: 'TREE PARAMETERS · roads, tickets, choice',
  placeholder:
    '{"n":6,"roads":[[1,2,3],[2,3,2],[2,4,1],[4,5,2],[4,6,4]],"tickets":[[1,5,10],[3,6,8],[1,3,3]],"choice":[1,5]}',
  presets: lessonPresets,
  parseInput,
  createFrames,
};
export * from './trace';
