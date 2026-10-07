import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  aliases: ['valid-parenthesis-string', '678'],
  Canvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'pop-star', label: 'Next star use' },
      { action: 'compare', label: 'Next index check' },
      { action: 'result', label: 'Result' },
    ],
  },
});
