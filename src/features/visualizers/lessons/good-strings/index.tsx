import { defineLesson } from '../../core/lesson';
import { goodStringsVisualizer } from './adapter';
import { GoodStringsCanvas } from './Canvas';
import { GoodStringsInputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: goodStringsVisualizer,
  aliases: ['count-ways-to-build-good-strings', '2466'],
  Canvas: GoodStringsCanvas,
  InputEditor: GoodStringsInputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'child-return', label: 'Next child return' },
      { action: 'add', label: 'Next addition' },
      { action: 'result', label: 'Result' },
    ],
  },
});
