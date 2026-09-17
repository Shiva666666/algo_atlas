import { defineLesson } from '../../core/lesson';
import { fallingPathVisualizer } from './adapter';
import { IntuitionCanvas } from '../../components/IntuitionCanvas';
export const lesson = defineLesson({
  adapter: fallingPathVisualizer,
  aliases: ['minimum-falling-path-sum'],
  Canvas: IntuitionCanvas,
});
