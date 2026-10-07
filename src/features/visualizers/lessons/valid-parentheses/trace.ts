import source from './reference.py?raw';
import type { ParenthesesData } from './types';
import type { VisualFrame } from '../../core/types';
import { parseObject } from '../../core/trace';
import { bracketString, referenceWriter } from '../../core/reference-trace';
export const referenceCode = source.trimEnd();
export function parseInput(raw: string) {
  return { s: bracketString(parseObject(raw).s, /^[(){}\[\]]+$/) };
}
export function createFrames(value: unknown) {
  const { s } = parseInput(JSON.stringify(value));
  const d: ParenthesesData = {
    s,
    index: -1,
    stack: [],
    matches: [],
    comparison: null,
    result: null,
    action: '',
    equation: '',
  };
  const frames: VisualFrame<ParenthesesData>[] = [];
  const emit = referenceWriter(referenceCode, 'valid-parentheses', d, frames);
  emit('initialize', 'stack = []', 'stack = []', 'Only unmatched openings remain on the stack.');
  const opens = '({[',
    closes = ')}]';
  for (let i = 0; i < s.length; i++) {
    d.index = i;
    d.comparison = null;
    emit(
      'read',
      'Read s[' + i + '] = ' + s[i],
      'for i in range(len(s)):',
      'Scan left to right; stack top is the most recent opening.',
    );
    const opening = opens.includes(s[i]);
    emit(
      'check',
      opening ? 'Opening bracket' : 'Closing bracket',
      "if s[i] == '(' or s[i] == '{' or s[i] == '[':",
      'An opening is stored; a closing must match the top.',
    );
    if (opening) {
      d.stack.push({ index: i, value: s[i] });
      emit(
        'push',
        'Push ' + s[i],
        'stack.append(s[i])',
        'Store this opening. Its input index is a derived identity.',
      );
      continue;
    }
    emit(
      'check',
      d.stack.length ? 'Stack is available' : 'Stack is empty',
      'elif not stack:',
      'A closing bracket needs an earlier unmatched opening.',
    );
    if (!d.stack.length) {
      d.comparison = { top: null, closer: s[i], expected: null, valid: false };
      d.result = false;
      emit(
        'result',
        'Return False · no opening',
        'return False',
        'This closing bracket has no available opening.',
        0,
      );
      return frames;
    }
    const top = d.stack.at(-1)!;
    let matched = false;
    for (let branch = 0; branch < 3; branch++) {
      const good = top.value === opens[branch] && s[i] === closes[branch];
      d.comparison = {
        top: top.index,
        closer: s[i],
        expected: closes[opens.indexOf(top.value)],
        valid: good,
      };
      emit(
        'compare',
        top.value +
          ' == ' +
          opens[branch] +
          ' and ' +
          s[i] +
          ' == ' +
          closes[branch] +
          ' → ' +
          good,
        [
          "elif stack[-1] == '(' and s[i] == ')':",
          "elif stack[-1] == '{' and s[i] == '}':",
          "elif stack[-1] == '[' and s[i] == ']':",
        ][branch],
        'Check bracket types in the saved branch order.',
      );
      if (good) {
        d.stack.pop();
        d.matches.push({ open: top.index, close: i });
        emit(
          'pop',
          'Pop matching ' + top.value,
          'stack.pop()',
          'The latest opening and this closer form a valid pair.',
          branch,
        );
        matched = true;
        break;
      }
    }
    if (!matched) {
      d.result = false;
      emit(
        'result',
        'Return False · wrong bracket type',
        'return False',
        'The top opening cannot be skipped to find a deeper match.',
        1,
      );
      return frames;
    }
  }
  d.index = s.length;
  d.result = d.stack.length === 0;
  emit(
    'result',
    'len(stack) = ' + d.stack.length + ' → ' + d.result,
    'return len(stack) == 0',
    'After scanning, any remaining opening is unclosed.',
  );
  return frames;
}
