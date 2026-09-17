import { defineLesson } from '../../core/lesson';
import { coinChangeVisualizer } from './adapter';
import { CoinChangeCanvas } from './Canvas';
export const lesson = defineLesson({
  adapter: coinChangeVisualizer,
  aliases: ['coin-change-ii'],
  Canvas: CoinChangeCanvas,
  preservePresentation: true,
});
