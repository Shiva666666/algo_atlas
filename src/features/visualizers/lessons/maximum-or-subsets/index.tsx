import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  Canvas,
  InputEditor,
  aliases: ['2044', 'count-number-of-maximum-bitwise-or-subsets'],
  source: 'leetcode',
  playback: {
    jumpsAfterSpeed: [
      { action: 'memo-hit', label: 'Next memo hit' },
      { action: 'return', label: 'Next return' },
    ],
  },
});
