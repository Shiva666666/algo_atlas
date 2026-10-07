import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  aliases: ['wiggle-sort-ii', '324'],
  Canvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'write', label: 'Next transfer' },
      { action: 'result', label: 'Modified array' },
    ],
  },
});
