import { defineLesson } from '../../core/lesson';
import { kokoVisualizer } from './adapter';
import { IntuitionCanvas } from '../../components/IntuitionCanvas';
export const lesson = defineLesson({
  adapter: kokoVisualizer,
  aliases: ['koko-eating-bananas'],
  Canvas: IntuitionCanvas,
});
