import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  Canvas,
  InputEditor,
  aliases: ['2235', 'add-two-integers'],
  source: 'leetcode',
  playback: {
    jumpsAfterSpeed: [
      { action: 'column', label: 'Next bit' },
      { action: 'sign-check', label: 'Signed result' },
    ],
  },
});
