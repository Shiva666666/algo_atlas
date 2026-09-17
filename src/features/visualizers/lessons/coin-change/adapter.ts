import type { VisualizerAdapter } from '../../core/types';
import { coinChangeCode } from './reference';
import { parseInput, createCoinChangeFrames } from './trace';
import type { CoinChangeData } from './types';
import { lessonPresets } from './presets';
export const coinChangeVisualizer: VisualizerAdapter<unknown, CoinChangeData> = {
  id: 'coin-change-ii',
  name: 'Take or skip, then remember',
  mode: 'specialized',
  description:
    'Follow your recursive solution: explore both branches, add their answers, and reuse completed states.',
  inputLabel: 'Coins and target amount',
  inputGuide: 'Amount 0–12; 1–5 unique coins from 1–99. Coin order is preserved.',
  placeholder: '{"coins":[1,2,5],"amount":5}',
  referenceCode: coinChangeCode,
  presets: lessonPresets,
  parseInput,
  createFrames: createCoinChangeFrames,
};
export * from './trace';
