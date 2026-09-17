import { defineLesson } from '../../core/lesson';
import { generateParenthesesVisualizer } from './adapter';
import { IntuitionCanvas } from '../../components/IntuitionCanvas';
export const lesson = defineLesson({
  adapter: generateParenthesesVisualizer,
  aliases: ['generate-parentheses', 'generate-all-possible-parentheses'],
  Canvas: IntuitionCanvas,
});
