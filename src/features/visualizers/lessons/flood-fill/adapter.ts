import type { VisualizerAdapter } from '../../core/types';
import type { FillData } from './types';
import { referenceCode, parseInput, createFrames } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, FillData> = {
  id: 'flood-fill',
  name: 'Flood Fill',
  mode: 'specialized',
  description:
    'Follow the FIFO wave, recoloring and marking on dequeue while preserving duplicate queue entries.',
  inputLabel: 'Flood Fill Explorer input',
  inputGuide: '1–8 rows × 1–10 columns, colors 0–9, valid zero-based sr and sc.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
export * from './trace';
