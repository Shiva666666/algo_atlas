import { defineLesson } from '../../core/lesson';
import { monotonicWindowVisualizer } from './adapter';
import { MonotonicWindowCanvas } from './Canvas';
export const lesson = defineLesson({
  adapter: monotonicWindowVisualizer,
  aliases: ['longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit'],
  Canvas: MonotonicWindowCanvas,
});
