import { defineLesson } from '../../core/lesson';
import { incremovableVisualizer } from './adapter';
import { IncremovableCanvas } from './Canvas';
export const lesson = defineLesson({
  adapter: incremovableVisualizer,
  aliases: ['count-the-number-of-incremovable-subarrays-i'],
  Canvas: IncremovableCanvas,
});
