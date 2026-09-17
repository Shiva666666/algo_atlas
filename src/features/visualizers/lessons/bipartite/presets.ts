import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  {
    label: 'Even cycle · true',
    input: '{"graph":[[1,3],[0,2],[1,3],[0,2]]}',
    source: 'LeetCode',
  },
  {
    label: 'Triangle · false',
    input: '{"graph":[[1,2,3],[0,2],[0,1,3],[0,2]]}',
    source: 'LeetCode',
  },
  {
    label: 'Disconnected components',
    input: '{"graph":[[1],[0],[3,4],[2],[2],[]]}',
    source: 'Diagnostic',
  },
  { label: 'Single isolated node', input: '{"graph":[[]]}', source: 'Diagnostic' },
];
