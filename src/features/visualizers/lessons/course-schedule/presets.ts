import type { VisualPreset } from '../../core/types';
export const coursePresets: VisualPreset[] = [
  {
    label: 'Official · branching diamond',
    input: '{"numCourses":4,"prerequisites":[[1,0],[2,0],[3,1],[3,2]]}',
    source: 'LeetCode',
  },
  {
    label: 'Chain',
    input: '{"numCourses":4,"prerequisites":[[1,0],[2,1],[3,2]]}',
    source: 'Diagnostic',
  },
  {
    label: 'No prerequisites · numeric FIFO',
    input: '{"numCourses":4,"prerequisites":[]}',
    source: 'Diagnostic',
  },
  {
    label: 'Disconnected DAG',
    input: '{"numCourses":5,"prerequisites":[[1,0],[3,2]]}',
    source: 'Diagnostic',
  },
  {
    label: 'Full cycle · early guard',
    input: '{"numCourses":3,"prerequisites":[[1,0],[2,1],[0,2]]}',
    source: 'Diagnostic',
  },
  {
    label: 'Disconnected cycle · partial processing',
    input: '{"numCourses":6,"prerequisites":[[1,0],[3,2],[2,3],[4,3]]}',
    source: 'Diagnostic',
  },
  {
    label: 'Multiple valid orders · input edge order',
    input: '{"numCourses":4,"prerequisites":[[2,0],[1,0],[3,2],[3,1]]}',
    source: 'Diagnostic',
  },
];
