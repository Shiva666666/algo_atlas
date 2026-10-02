import type { VisualPreset } from '../../core/types';
export const goodStringsPresets: VisualPreset[] = [
  {
    label: 'Official · length 3, answer 8',
    input: '{"low":3,"high":3,"zero":1,"one":1}',
    source: 'LeetCode',
  },
  {
    label: 'Official · lengths 2–3, answer 5',
    input: '{"low":2,"high":3,"zero":1,"one":2}',
    source: 'LeetCode',
  },
  {
    label: 'Equal blocks · distinct choices',
    input: '{"low":2,"high":4,"zero":2,"one":2}',
    source: 'Diagnostic',
  },
  {
    label: 'Unequal blocks · memo reuse',
    input: '{"low":3,"high":8,"zero":2,"one":3}',
    source: 'Diagnostic',
  },
  {
    label: 'Exact interval · reachable 4',
    input: '{"low":4,"high":4,"zero":2,"one":4}',
    source: 'Diagnostic',
  },
  {
    label: 'Unreachable length · overshoot',
    input: '{"low":3,"high":3,"zero":2,"one":2}',
    source: 'Diagnostic',
  },
];
