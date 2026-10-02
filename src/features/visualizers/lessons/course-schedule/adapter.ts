import type { VisualizerAdapter } from '../../core/types';
import type { CourseData } from './types';
import { coursePresets } from './presets';
import { courseCode, parseCourseInput, createCourseFrames } from './trace';
export const courseVisualizer: VisualizerAdapter<unknown, CourseData> = {
  id: 'course-schedule-ii',
  name: 'Course Schedule II',
  mode: 'specialized',
  description: 'Follow prerequisite edges, indegree changes and FIFO order in your Kahn traversal.',
  inputLabel: 'Courses and prerequisite pairs',
  inputGuide:
    'Teaching limits: 1–12 courses. Unique [course, prerequisite] pairs, valid IDs, no self-edges.',
  placeholder: '{"numCourses":2,"prerequisites":[[1,0]]}',
  referenceCode: courseCode,
  presets: coursePresets,
  parseInput: parseCourseInput,
  createFrames: createCourseFrames,
};
export * from './trace';
