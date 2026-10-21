import type { VisualPreset } from '../../core/types';
export const presets: VisualPreset[] = [
  { label: 'Official · 12 + 5 = 17', input: '{"num1":12,"num2":5}', source: 'LeetCode' },
  { label: 'Official · −10 + 4 = −6', input: '{"num1":-10,"num2":4}', source: 'LeetCode' },
  { label: 'Both zero · 0', input: '{"num1":0,"num2":0}', source: 'Diagnostic' },
  { label: 'Zero preserves a negative · −7', input: '{"num1":0,"num2":-7}', source: 'Diagnostic' },
  { label: 'Carry chain · 7 + 1 = 8', input: '{"num1":7,"num2":1}', source: 'Diagnostic' },
  {
    label: '32-bit cancellation · −1 + 1 = 0',
    input: '{"num1":-1,"num2":1}',
    source: 'Diagnostic',
  },
  { label: 'Both negative · −5 + −7 = −12', input: '{"num1":-5,"num2":-7}', source: 'Diagnostic' },
  {
    label: 'Opposite boundaries · −100 + 100 = 0',
    input: '{"num1":-100,"num2":100}',
    source: 'Diagnostic',
  },
  { label: 'Maximum positive sum · 200', input: '{"num1":100,"num2":100}', source: 'Diagnostic' },
  {
    label: 'Minimum negative sum · −200',
    input: '{"num1":-100,"num2":-100}',
    source: 'Diagnostic',
  },
  { label: 'No carry · 2 + 4 = 6', input: '{"num1":2,"num2":4}', source: 'Diagnostic' },
];
