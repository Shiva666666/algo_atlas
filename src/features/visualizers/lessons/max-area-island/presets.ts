import type { VisualPreset } from '../../core/types';

import { officialIslandGrid } from './trace';
export const lessonPresets: VisualPreset[] = [
  {
    label: 'Diagnostic · separate islands → 3',
    source: 'Diagnostic',
    input: JSON.stringify({
      grid: [
        [1, 1, 0],
        [0, 1, 0],
        [1, 0, 1],
      ],
    }),
  },
  {
    label: 'Official · largest island → 6',
    source: 'LeetCode',
    input: JSON.stringify({ grid: officialIslandGrid }),
  },
  {
    label: 'Official · water only → 0',
    source: 'LeetCode',
    input: '{"grid":[[0,0,0,0,0,0,0,0]]}',
  },
  { label: 'Diagnostic · single land → 1', source: 'Diagnostic', input: '{"grid":[[1]]}' },
  { label: 'Diagnostic · diagonals → 1', source: 'Diagnostic', input: '{"grid":[[1,0],[0,1]]}' },
  {
    label: 'Diagnostic · all land → 6',
    source: 'Diagnostic',
    input: '{"grid":[[1,1,1],[1,1,1]]}',
  },
];
