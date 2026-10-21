import { defineLesson } from '../../core/lesson';
import { visualizer } from './adapter';
import { Canvas } from './Canvas';
import { InputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: visualizer,
  Canvas,
  InputEditor,
  aliases: ['630', 'course-schedule-iii'],
  source: 'leetcode',
  playback: {
    jumpsAfterSpeed: [
      { action: 'replace', label: 'Next replacement' },
      { action: 'skip', label: 'Next skip' },
    ],
  },
});
