import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  aliases: ['score-of-parentheses', '856'],
  Canvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'contribute', label: 'Next contribution' },
      { action: 'result', label: 'Result' },
    ],
  },
});
