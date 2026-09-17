import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  { label: 'Default duplicate pair', input: '{"nums":[1,2,2]}', source: 'LeetCode' },
  { label: 'All duplicates', input: '{"nums":[2,2,2]}', source: 'Diagnostic' },
  { label: 'No duplicates', input: '{"nums":[1,2,3]}', source: 'Diagnostic' },
  { label: 'Duplicate groups', input: '{"nums":[1,1,2,2]}', source: 'Diagnostic' },
  { label: 'Empty input', input: '{"nums":[]}', source: 'Diagnostic' },
];
