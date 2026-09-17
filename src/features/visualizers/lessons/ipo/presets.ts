import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  {
    label: 'Default · unlock after first pick',
    input: '{"k":2,"w":0,"profits":[1,2,3],"capital":[0,1,1]}',
    source: 'LeetCode',
  },
  {
    label: 'Nothing affordable',
    input: '{"k":3,"w":0,"profits":[1,2],"capital":[1,2]}',
    source: 'Diagnostic',
  },
  {
    label: 'All affordable immediately',
    input: '{"k":2,"w":5,"profits":[1,9,4],"capital":[0,2,5]}',
    source: 'Diagnostic',
  },
  {
    label: 'k exceeds useful projects',
    input: '{"k":5,"w":1,"profits":[2,3],"capital":[0,3]}',
    source: 'Diagnostic',
  },
];
