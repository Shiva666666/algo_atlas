import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  Canvas,
  InputEditor,
  aliases: ['2916', 'subarrays-distinct-element-sum-of-squares-ii'],
  source: 'leetcode',
  playback: {
    hideTransitions: true,
    jumpsAfterSpeed: [
      { action: 'right', label: 'Next right endpoint' },
      { action: 'push', label: 'Next push' },
      { action: 'contribution', label: 'Next contribution' },
    ],
  },
});
