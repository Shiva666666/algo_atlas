import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  Canvas,
  InputEditor,
  aliases: ['3551', 'minimum-swaps-to-sort-by-digit-sum'],
  source: 'leetcode',
  playback: {
    jumpsAfterSpeed: [
      { action: 'swap', label: 'Next swap' },
      { action: 'confirmed', label: 'Next confirmed position' },
    ],
  },
});
