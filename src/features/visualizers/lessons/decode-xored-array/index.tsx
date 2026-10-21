import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  Canvas,
  InputEditor,
  aliases: ['1720', 'decode-xored-array'],
  source: 'leetcode',
  playback: {
    jumpsAfterSpeed: [
      { action: 'xor', label: 'Next XOR' },
      { action: 'append', label: 'Next append' },
    ],
  },
});
