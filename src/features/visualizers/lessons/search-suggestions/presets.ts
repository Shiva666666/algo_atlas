import type { VisualPreset } from '../../core/types';

export const lessonPresets: VisualPreset[] = [
  {
    label: 'Mouse suggestions',
    input: '{"products":["mobile","mouse","moneypot","monitor","mousepad"],"searchWord":"mouse"}',
    source: 'LeetCode',
  },
  {
    label: 'The prefix is also a product',
    input: '{"products":["app","apple","application","apt"],"searchWord":"app"}',
    source: 'Diagnostic',
  },
  {
    label: 'Missing branch',
    input: '{"products":["bags","baggage","banner"],"searchWord":"xyz"}',
    source: 'Diagnostic',
  },
  {
    label: 'Exactly three results',
    input: '{"products":["car","carbon","card","care","cargo"],"searchWord":"car"}',
    source: 'Diagnostic',
  },
];
