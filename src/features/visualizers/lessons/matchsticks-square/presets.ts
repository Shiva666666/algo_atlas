import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  {
    label: 'LeetCode example · true',
    input: JSON.stringify({ matchsticks: [1, 1, 2, 2, 2] }),
    source: 'LeetCode',
  },
  {
    label: 'LeetCode example · false',
    input: JSON.stringify({ matchsticks: [3, 3, 3, 3, 4] }),
    source: 'LeetCode',
  },
  {
    label: 'Diagnostic · sibling branch lesson',
    input: JSON.stringify({ matchsticks: [2, 2, 2, 2, 3, 3, 7, 7] }),
    source: 'Diagnostic',
  },
  {
    label: 'Non-divisible total',
    input: JSON.stringify({ matchsticks: [1, 1, 1, 2] }),
    source: 'Diagnostic',
  },
  {
    label: 'Oversized stick',
    input: JSON.stringify({ matchsticks: [9, 1, 1, 1] }),
    source: 'Diagnostic',
  },
];
