import { defineLesson } from '../../core/lesson';
import { ipoVisualizer } from './adapter';
import { IntuitionCanvas } from '../../components/IntuitionCanvas';
export const lesson = defineLesson({
  adapter: ipoVisualizer,
  aliases: ['ipo'],
  Canvas: IntuitionCanvas,
});
