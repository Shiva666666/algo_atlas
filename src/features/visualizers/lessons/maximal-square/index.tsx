import { defineLesson } from '../../core/lesson';
import { maximalSquareVisualizer } from './adapter';
import { IntuitionCanvas } from '../../components/IntuitionCanvas';
export const lesson = defineLesson({
  adapter: maximalSquareVisualizer,
  aliases: ['maximal-square'],
  Canvas: IntuitionCanvas,
});
