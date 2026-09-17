import { defineLesson } from '../../core/lesson';
import { specialArrayVisualizer } from './adapter';
import { IntuitionCanvas } from '../../components/IntuitionCanvas';
export const lesson = defineLesson({
  adapter: specialArrayVisualizer,
  aliases: ['special-array-with-x-elements-greater-than-or-equal-x'],
  Canvas: IntuitionCanvas,
});
