import type { VisualPreset } from '../../core/types';
export const minimumTimePresets: VisualPreset[] = [
  { label: 'Official · competing routes', source: 'LeetCode', input: '{"moveTime":[[0,4],[4,4]]}' },
  {
    label: 'Diagnostic · required wait',
    source: 'Diagnostic',
    input: '{"moveTime":[[0,5,5],[0,0,0]]}',
  },
  {
    label: 'Diagnostic · start gate ignored',
    source: 'Diagnostic',
    input: '{"moveTime":[[9,0],[0,0]]}',
  },
  {
    label: 'Diagnostic · gated destination',
    source: 'Diagnostic',
    input: '{"moveTime":[[0,0],[0,10]]}',
  },
  {
    label: 'Diagnostic · equal priorities',
    source: 'Diagnostic',
    input: '{"moveTime":[[0,0,0],[0,0,0]]}',
  },
];
