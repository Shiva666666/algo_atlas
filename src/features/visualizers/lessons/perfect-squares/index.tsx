import { defineLesson } from '../../core/lesson';
import { squaresVisualizer } from './adapter';
import { SquaresCanvas } from './Canvas';
import { SquaresInputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: squaresVisualizer,
  aliases: ['perfect-squares', '279'],
  Canvas: SquaresCanvas,
  InputEditor: SquaresInputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'child-return', label: 'Next child return' },
      { action: 'write', label: 'Next memo write' },
      { action: 'result', label: 'Result' },
    ],
  },
});
