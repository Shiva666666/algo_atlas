import { defineLesson } from '../../core/lesson';
import { depthVisualizer } from './adapter';
import { DepthCanvas } from './Canvas';
import { DepthInputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: depthVisualizer,
  aliases: ['maximum-nesting-depth-of-the-parentheses', '1614'],
  Canvas: DepthCanvas,
  InputEditor: DepthInputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'maximum', label: 'Next maximum check' },
      { action: 'result', label: 'Result' },
    ],
  },
});
