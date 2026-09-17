import { defineLesson } from '../../core/lesson';
import { subsetsVisualizer } from './adapter';
import { IntuitionCanvas } from '../../components/IntuitionCanvas';
export const lesson = defineLesson({
  adapter: subsetsVisualizer,
  aliases: ['subsets-ii'],
  Canvas: IntuitionCanvas,
});
