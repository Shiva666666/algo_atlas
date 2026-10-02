import { defineLesson } from '../../core/lesson';
import { triangleVisualizer } from './adapter';
import { TriangleCanvas } from './Canvas';
import { TriangleInputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: triangleVisualizer,
  aliases: ['triangle', '120'],
  Canvas: TriangleCanvas,
  InputEditor: TriangleInputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'compare', label: 'Next comparison' },
      { action: 'result', label: 'Result' },
    ],
  },
});
