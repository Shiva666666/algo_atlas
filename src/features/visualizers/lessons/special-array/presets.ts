import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  { label: 'Answer does not appear', input: '{"nums":[3,5]}', source: 'LeetCode' },
  { label: 'No valid x', input: '{"nums":[0,0]}', source: 'LeetCode' },
  { label: 'Mixed zeros', input: '{"nums":[0,4,3,0,4]}', source: 'LeetCode' },
  { label: 'Boundary not exact', input: '{"nums":[3,6,7,7,0]}', source: 'Diagnostic' },
];
