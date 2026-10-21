import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  Canvas,
  InputEditor,
  aliases: ['29', 'divide-two-integers'],
  source: 'leetcode',
  playback: {
    jumpsAfterSpeed: [
      { action: 'subtract', label: 'Next fitting chunk' },
      { action: 'result', label: 'Final result' },
    ],
  },
});
