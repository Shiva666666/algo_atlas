import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  {
    label: 'Branching tree · one chosen path',
    input:
      '{"n":6,"roads":[[1,2,3],[2,3,2],[2,4,1],[4,5,2],[4,6,4]],"tickets":[[1,5,10],[3,6,8],[1,3,3]],"choice":[1,5]}',
    source: 'HackerRank',
  },
  {
    label: 'Two-node tree',
    input: '{"n":2,"roads":[[1,2,5]],"tickets":[[1,2,9]],"choice":[1,2]}',
    source: 'Diagnostic',
  },
  {
    label: 'Path-shaped tree',
    input:
      '{"n":5,"roads":[[1,2,1],[2,3,2],[3,4,3],[4,5,4]],"tickets":[[1,4,9],[2,5,8]],"choice":[2,5]}',
    source: 'Diagnostic',
  },
];
