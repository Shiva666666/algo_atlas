import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  aliases: ['minimum-add-to-make-parentheses-valid', '921'],
  Canvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'missing-open', label: 'Next missing opening' },
      { action: 'finish', label: 'Finish count' },
    ],
  },
});
