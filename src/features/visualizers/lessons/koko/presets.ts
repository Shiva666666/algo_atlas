import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  { label: 'Default example', input: '{"piles":[3,6,7,11],"h":8}', source: 'LeetCode' },
  { label: 'Tight deadline', input: '{"piles":[30,11,23,4,20],"h":5}', source: 'LeetCode' },
  { label: 'One extra hour', input: '{"piles":[30,11,23,4,20],"h":6}', source: 'LeetCode' },
  { label: 'Single pile', input: '{"piles":[9],"h":3}', source: 'Diagnostic' },
];
