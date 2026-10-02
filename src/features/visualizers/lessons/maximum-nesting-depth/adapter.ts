import type { VisualizerAdapter } from '../../core/types';
import { depthPresets } from './presets';
import { depthCode, parseDepthInput, createDepthFrames } from './trace';
import type { DepthData } from './types';
export const depthVisualizer: VisualizerAdapter<unknown, DepthData> = {
  id: 'maximum-nesting-depth-of-the-parentheses',
  name: 'Maximum Nesting Depth',
  mode: 'specialized',
  description:
    'Watch current depth change and record its maximum at closing parentheses, exactly as in your solution.',
  inputLabel: 'Parentheses expression',
  inputGuide: '1–64 digits or +, −, *, /, (, ); parentheses must be balanced.',
  placeholder: '{"s":"((1))"}',
  referenceCode: depthCode,
  presets: depthPresets,
  parseInput: parseDepthInput,
  createFrames: createDepthFrames,
};
export * from './trace';
