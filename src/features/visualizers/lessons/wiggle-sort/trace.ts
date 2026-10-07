import source from './reference.py?raw';
import type { WiggleData } from './types';
import type { VisualFrame } from '../../core/types';
import { parseObject } from '../../core/trace';
import { referenceWriter } from '../../core/reference-trace';
export const referenceCode = source.trimEnd();
export function isWiggle(nums: number[]) {
  return nums.every((v, i) => i === 0 || (i % 2 === 1 ? nums[i - 1] < v : nums[i - 1] > v));
}
export function parseInput(raw: string) {
  const { nums } = parseObject(raw);
  if (
    !Array.isArray(nums) ||
    nums.length < 1 ||
    nums.length > 12 ||
    !nums.every((v) => Number.isSafeInteger(v) && v >= 0 && v <= 5000)
  )
    throw new Error('nums must have 1–12 integers from 0 to 5000.');
  const sorted = [...nums].sort((a, b) => a - b);
  let i = Math.floor((nums.length - 1) / 2),
    j = nums.length - 1;
  const result: number[] = [];
  while (result.length < nums.length) {
    result.push(sorted[i--]);
    if (result.length < nums.length) result.push(sorted[j--]);
  }
  if (!isWiggle(result))
    throw new Error(
      'This input cannot form the required strict wiggle. Choose values that satisfy the problem’s valid-answer guarantee.',
    );
  return { nums: [...nums] as number[] };
}
export function createFrames(value: unknown) {
  const { nums } = parseInput(JSON.stringify(value));
  const frames: VisualFrame<WiggleData>[] = [];
  const d: WiggleData = {
    original: [...nums],
    nums: [...nums],
    sorted: [],
    i: 0,
    j: 0,
    z: 0,
    written: [],
    transfer: null,
    result: null,
    action: '',
    equation: '',
  };
  const emit = referenceWriter(referenceCode, 'wiggle-sort', d, frames);
  d.sorted = nums.map((value, id) => ({ value, id })).sort((a, b) => a.value - b.value);
  emit(
    'sort',
    'x = sorted(nums)',
    'x = sorted(nums)',
    'Create a sorted copy. Equal values retain distinct derived occurrence identities; the sort is one operation, not a fabricated sorting trace.',
  );
  d.i = Math.floor((nums.length - 1) / 2);
  emit(
    'initialize',
    'i = ' + d.i,
    'i = (len(nums) - 1) // 2',
    'Start at the end of the lower half: this supplies valleys.',
  );
  d.j = nums.length - 1;
  emit(
    'initialize',
    'j = ' + d.j,
    'j = len(nums) - 1',
    'Start at the end of the upper half: this supplies peaks.',
  );
  emit(
    'initialize',
    'z = 0',
    'z = 0',
    'Destination nums still contains its original values until each position is overwritten.',
  );
  while (d.z < nums.length) {
    emit(
      'check',
      'z < len(nums) → True',
      'while z < len(nums):',
      'Fill the next even position from the lower half.',
    );
    d.transfer = { source: d.i, destination: d.z, kind: 'valley' };
    d.nums[d.z] = d.sorted[d.i].value;
    d.written.push(d.z);
    emit(
      'write',
      'nums[' + d.z + '] = x[' + d.i + '] = ' + d.nums[d.z],
      'nums[z] = x[i]',
      'Write a valley. The lower half is read in reverse.',
    );
    d.z++;
    emit('advance', 'z = ' + d.z, 'z += 1', 'Move the destination pointer.', 0);
    d.i--;
    emit('advance', 'i = ' + d.i, 'i -= 1', 'Move the lower-half pointer left.');
    emit(
      'check',
      'z < len(nums) → ' + (d.z < nums.length),
      'if z < len(nums):',
      'For an odd-length input, the last peak write is skipped.',
    );
    if (d.z < nums.length) {
      d.transfer = { source: d.j, destination: d.z, kind: 'peak' };
      d.nums[d.z] = d.sorted[d.j].value;
      d.written.push(d.z);
      emit(
        'write',
        'nums[' + d.z + '] = x[' + d.j + '] = ' + d.nums[d.z],
        'nums[z] = x[j]',
        'Write a peak. Reverse interleaving separates repeated values.',
      );
      d.z++;
      emit('advance', 'z = ' + d.z, 'z += 1', 'Move the destination pointer.', 1);
      d.j--;
      emit('advance', 'j = ' + d.j, 'j -= 1', 'Move the upper-half pointer left.');
    }
  }
  d.result = [...d.nums];
  d.transfer = null;
  emit(
    'result',
    'Modified nums · ' + d.nums.join(', '),
    'while z < len(nums):',
    'The loop condition is now false. Python implicitly returns None; the diagram verifies the modified array, not a returned list.',
  );
  return frames;
}
