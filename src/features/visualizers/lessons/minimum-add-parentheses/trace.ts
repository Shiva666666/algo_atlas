import source from './reference.py?raw';
import type { MinimumAddData } from './types';
import type { VisualFrame } from '../../core/types';
import { parseObject } from '../../core/trace';
import { bracketString, referenceWriter } from '../../core/reference-trace';
export const referenceCode = source.trimEnd();
export function parseInput(raw: string) {
  return { s: bracketString(parseObject(raw).s, /^[()]+$/) };
}
export function createFrames(value: unknown) {
  const { s } = parseInput(JSON.stringify(value));
  const frames: VisualFrame<MinimumAddData>[] = [];
  const d: MinimumAddData = {
    s,
    index: -1,
    stack: [],
    count: 0,
    missingOpen: 0,
    missingClose: null,
    result: null,
    action: '',
    equation: '',
  };
  const emit = referenceWriter(referenceCode, 'minimum-add-parentheses', d, frames);
  emit('initialize', 'stack = []', 'stack = []', 'Keep unmatched opening parentheses.');
  emit(
    'initialize',
    'count = 0',
    'count = 0',
    'During the scan, count records closers missing an opening.',
  );
  for (let i = 0; i < s.length; i++) {
    d.index = i;
    emit(
      'read',
      'Read ' + s[i] + ' at index ' + i,
      'for par in s:',
      'Each parenthesis either stores an opening or consumes one.',
    );
    emit('check', "par = '" + s[i] + "'", 'match par:', 'Select the matching Python case.');
    if (s[i] === '(') {
      d.stack.push({ index: i, value: '(' });
      emit(
        'push',
        'Store opening at ' + i,
        'stack.append(par)',
        'This opening may match a later closer.',
      );
    } else {
      emit(
        'check',
        d.stack.length ? 'An opening is available' : 'No opening is available',
        'if stack:',
        'A matching opener avoids an insertion.',
      );
      if (d.stack.length) {
        d.stack.pop();
        emit(
          'pop',
          'Match this closing parenthesis',
          'stack.pop()',
          'Remove the latest unmatched opening.',
        );
      } else {
        d.count++;
        d.missingOpen++;
        emit(
          'missing-open',
          'count = ' + d.count,
          'count+=1',
          'This closer requires one inserted opening. The string itself is not changed.',
        );
      }
    }
  }
  d.index = s.length;
  d.missingClose = d.stack.length;
  d.count += d.stack.length;
  emit(
    'finish',
    d.missingOpen + ' missing openings + ' + d.missingClose + ' missing closings = ' + d.count,
    'count+=len(stack)',
    'Every remaining opening needs a closing parenthesis.',
  );
  d.result = d.count;
  emit(
    'result',
    'Return ' + d.count,
    'return count',
    'The total is the minimum number of insertions, not a rewritten string.',
  );
  return frames;
}
