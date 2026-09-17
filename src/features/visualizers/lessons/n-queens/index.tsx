import { defineLesson } from '../../core/lesson';
import { nQueensVisualizer } from './adapter';
import { NQueensCanvas } from './Canvas';
export const lesson = defineLesson({
  adapter: nQueensVisualizer,
  aliases: ['33'],
  Canvas: NQueensCanvas,
  preservePresentation: true,
  source: 'lintcode',
});
