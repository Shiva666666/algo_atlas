import { defineLesson } from '../../core/lesson';
import { courseVisualizer } from './adapter';
import { CourseCanvas } from './Canvas';
import { CourseInputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: courseVisualizer,
  aliases: ['course-schedule-ii', '210'],
  Canvas: CourseCanvas,
  InputEditor: CourseInputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'decrement', label: 'Next indegree change' },
      { action: 'dequeue', label: 'Next dequeue' },
      { action: 'result', label: 'Result' },
    ],
  },
});
