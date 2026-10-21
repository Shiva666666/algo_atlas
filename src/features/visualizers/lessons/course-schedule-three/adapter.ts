import type { VisualizerAdapter } from '../../core/types';
import type { CourseData } from './types';
import { referenceCode, parseInput, createFrames } from './trace';
import { presets } from './presets';
export const visualizer: VisualizerAdapter<unknown, CourseData> = {
  id: 'course-schedule-three',
  name: 'Course Schedule III / Deadline Heap Studio',
  mode: 'specialized',
  description:
    'Scan deadlines, keep feasible courses, and replace the longest duration when a shorter one frees time.',
  inputLabel: 'Course schedule input',
  inputGuide: '1–12 courses; duration/deadline integers from 1 through 10,000. Duplicates allowed.',
  placeholder: presets[0].input,
  referenceCode,
  presets,
  parseInput,
  createFrames,
};
