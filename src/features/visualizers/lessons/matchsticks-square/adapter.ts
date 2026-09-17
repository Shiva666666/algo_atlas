import { matchsticksSquareCode } from './reference';
import type { VisualizerAdapter } from '../../core/types';
import {
  MAX_STICKS,
  MAX_FRAMES,
  parseMatchsticksInput,
  createMatchsticksFrames,
  defaultInput,
} from './trace';
import type { MatchsticksFrameData } from './types';
import { lessonPresets } from './presets';
export const matchsticksSquareVisualizer: VisualizerAdapter<unknown, MatchsticksFrameData> = {
  id: 'matchsticks-to-square',
  name: 'Matchsticks to Square · Backtracking',
  mode: 'specialized',
  description:
    'Watch each legal side choice, failed child return, and sibling exploration build—or rule out—a square.',
  inputLabel: 'MATCHSTICKS · four side assignment',
  inputGuide: `Use 1–${MAX_STICKS} positive safe-integer sticks. The trace is capped at ${MAX_FRAMES.toLocaleString('en-IN')} frames so every displayed result is complete.`,
  placeholder: JSON.stringify({ matchsticks: defaultInput }),
  referenceCode: matchsticksSquareCode,
  presets: lessonPresets,
  parseInput: parseMatchsticksInput,
  createFrames: createMatchsticksFrames,
  presentation: 'diagram-first',
  inputEditor: 'matchsticks',
  mistakeExplanation: [
    'A side that fits is only a candidate. If its child returns False, the parent must continue with right, top, and down.',
    'The saved code passes scalar side totals, so returning from recursion restores the parent arguments naturally; no explicit undo statement is executed.',
    'The optional max(matchsticks) > target guard is a useful optimization, but it is not part of this screenshot-faithful trace.',
  ],
};
export * from './trace';
