import source from './reference.py?raw';
import type { ScoreData } from './types';
import type { VisualFrame } from '../../core/types';
import { parseObject } from '../../core/trace';
import { bracketString, referenceWriter } from '../../core/reference-trace';
export const referenceCode = source.trimEnd();
export function parseInput(raw: string) {
  const s = bracketString(parseObject(raw).s, /^[()]+$/, 2);
  let depth = 0;
  for (const c of s) {
    depth += c === '(' ? 1 : -1;
    if (depth < 0) throw new Error('Score input must be balanced.');
  }
  if (depth) throw new Error('Score input must be balanced.');
  return { s };
}
export function createFrames(value: unknown) {
  const { s } = parseInput(JSON.stringify(value));
  const frames: VisualFrame<ScoreData>[] = [];
  const d: ScoreData = {
    s,
    index: 0,
    depth: 0,
    total: 0,
    contributions: [],
    result: null,
    action: '',
    equation: '',
  };
  const emit = referenceWriter(referenceCode, 'score-parentheses', d, frames);
  for (const line of ['i = 0', 'n = len(s)', 'global_track = 0', 'depth = 0'])
    emit('initialize', line, line, 'Initialize the pointer, string length and two counters.');
  while (d.index < s.length) {
    emit(
      'read',
      'Read ' + s[d.index] + ' at ' + d.index,
      'while i < n:',
      'The loop processes one parenthesis per iteration.',
    );
    emit(
      'check',
      s[d.index] === '(' ? 'Opening: increase depth' : 'Closing: decrease depth',
      "if s[i] == '(':",
      'Only a primitive () pair contributes directly.',
    );
    if (s[d.index] === '(') {
      d.depth++;
      emit('open', 'depth = ' + d.depth, 'depth += 1', 'One more enclosing level is active.');
      d.index++;
      emit('advance', 'i = ' + d.index, 'i += 1', 'Advance after this opening.', 0);
    } else {
      d.depth--;
      emit(
        'close',
        'depth = ' + d.depth,
        'depth -= 1',
        'Decrease first. This is the number of enclosing pairs around a possible leaf.',
      );
      const leaf = s[d.index - 1] === '(';
      emit(
        'compare',
        leaf
          ? 'Previous character is ( · primitive leaf'
          : 'Previous character is ) · no new contribution',
        "if s[i - 1] == '(':",
        'A primitive leaf contributes 2 raised to its enclosing depth.',
      );
      if (leaf) {
        const value = 2 ** d.depth;
        d.contributions.push({ index: d.index, depth: d.depth, value });
        d.total += value;
        emit(
          'contribute',
          '+' + value + ' = 2 ** ' + d.depth + ' · total ' + d.total,
          'global_track += 2 ** depth',
          'Each enclosing pair doubles this leaf’s score.',
        );
      }
      d.index++;
      emit('advance', 'i = ' + d.index, 'i += 1', 'Advance after the closer.', 1);
    }
  }
  d.result = d.total;
  emit(
    'result',
    'Return ' + d.total,
    'return global_track',
    'The sum of primitive-leaf contributions is the complete score.',
  );
  return frames;
}
