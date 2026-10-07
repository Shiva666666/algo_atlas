import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  aliases: ['remove-invalid-parentheses', '301'],
  Canvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'delete', label: 'Next deletion' },
      { action: 'count-check', label: 'Next validation' },
      { action: 'resume', label: 'Next return' },
      { action: 'record', label: 'Next answer' },
    ],
  },
});
