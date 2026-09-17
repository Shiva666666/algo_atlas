import { defineLesson } from '../../core/lesson';
import { matchsticksSquareVisualizer } from './adapter';
import { MatchsticksCanvas } from './Canvas';
import { MatchsticksInputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: matchsticksSquareVisualizer,
  aliases: ['matchsticks-to-square', '473'],
  Canvas: MatchsticksCanvas,
  InputEditor: MatchsticksInputEditor,
  playback: {
    jumpsBeforeSpeed: [
      {
        action: 'prune',
        label: 'Next rejection',
        title: 'Jump to next capacity rejection',
        className: 'matchsticks-jump-control',
      },
      {
        action: 'resume',
        label: 'Next backtrack',
        title: 'Jump to next failed-child return',
        className: 'matchsticks-jump-control',
      },
    ],
  },
});
