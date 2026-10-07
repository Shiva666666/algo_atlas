import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  aliases: ['flood-fill', '733'],
  Canvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'recolor', label: 'Next pixel' },
      { action: 'skip', label: 'Next duplicate' },
      { action: 'result', label: 'Result' },
    ],
  },
});
