import { defineLesson } from '../../core/lesson';
import { removeKDigitsVisualizer } from './adapter';
import { RemoveKDigitsCanvas } from './Canvas';
import { RemoveKDigitsInputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: removeKDigitsVisualizer,
  aliases: ['remove-k-digits', '402'],
  Canvas: RemoveKDigitsCanvas,
  InputEditor: RemoveKDigitsInputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'pop', label: 'Next removal' },
      { nextPhase: true, label: 'Next phase' },
    ],
  },
});
