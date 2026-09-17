import { defineLesson } from '../../core/lesson';
import { uniqueSplitVisualizer } from './adapter';
import { UniqueSplitCanvas } from './Canvas';
export const lesson = defineLesson({
  adapter: uniqueSplitVisualizer,
  aliases: ['split-a-string-into-the-max-number-of-unique-substrings', '1593'],
  Canvas: UniqueSplitCanvas,
});
