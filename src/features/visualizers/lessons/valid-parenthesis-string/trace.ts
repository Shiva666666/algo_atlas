import source from './reference.py?raw';
import type { WildcardData } from './types';
import type { VisualFrame } from '../../core/types';
import { parseObject } from '../../core/trace';
import { bracketString, referenceWriter } from '../../core/reference-trace';
export const referenceCode = source.trimEnd();
export function parseInput(raw: string) {
  return { s: bracketString(parseObject(raw).s, /^[()*]+$/) };
}
export function createFrames(value: unknown) {
  const { s } = parseInput(JSON.stringify(value));
  const frames: VisualFrame<WildcardData>[] = [];
  const d: WildcardData = {
    s,
    index: -1,
    openings: [],
    stars: [],
    roles: [],
    consumed: [],
    pair: null,
    result: null,
    action: '',
    equation: '',
  };
  const emit = referenceWriter(referenceCode, 'valid-parenthesis-string', d, frames);
  emit(
    'initialize',
    'queue = deque()',
    'queue = deque()',
    'Despite its name, queue is used as a stack: append and pop at the right.',
  );
  emit('initialize', 'stars = deque()', 'stars = deque()', 'Store wildcard positions separately.');
  const fail = (occurrence: number, message: string) => {
    d.result = false;
    emit('result', 'Return False', 'return False', message, occurrence);
    return frames;
  };
  for (let i = 0; i < s.length; i++) {
    d.index = i;
    emit(
      'read',
      'Read ' + s[i] + ' at index ' + i,
      'for i, par in enumerate(s):',
      'Indexes preserve the order required for wildcard matching.',
    );
    emit(
      'check',
      s[i] === '(' ? 'Opening' : 'Not an opening',
      "if par == '(':",
      'Openings are stored before checking a closing character.',
    );
    if (s[i] === '(') {
      d.openings.push(i);
      emit(
        'push-open',
        'Store opening ' + i,
        'queue.append(i)',
        'An ordinary opening is preferred over a star for later closers.',
      );
      continue;
    }
    emit(
      'check',
      s[i] === ')' ? 'Closing parenthesis' : 'Wildcard',
      "elif par == ')':",
      'A wildcard is stored; a closer needs an available resource.',
    );
    if (s[i] === '*') {
      d.stars.push(i);
      d.roles.push({ index: i, role: 'pending' });
      emit('push-star', 'Store star ' + i, 'stars.append(i)', 'Its role is not yet committed.');
      continue;
    }
    emit(
      'check',
      d.openings.length ? 'Use an opening first' : 'No ordinary opening',
      'if queue:',
      'Check ordinary openings before wildcard resources.',
    );
    if (d.openings.length) {
      const resource = d.openings.pop()!;
      d.consumed.push({ resource, close: i });
      emit(
        'pop-open',
        'Consume opening ' + resource,
        'queue.pop()',
        'Resource consumption is not necessarily a final nested-pair diagram.',
        0,
      );
    } else {
      emit(
        'check',
        d.stars.length ? 'Use an earlier star as (' : 'No earlier star',
        'elif stars:',
        'A preceding wildcard can serve as an opening.',
      );
      if (!d.stars.length)
        return fail(0, 'No available opening or earlier wildcard can match this closer.');
      const resource = d.stars.pop()!;
      d.roles.find((r) => r.index === resource)!.role = 'opening';
      d.consumed.push({ resource, close: i });
      emit(
        'pop-star',
        'Star ' + resource + ' serves as (',
        'stars.pop()',
        'This star supplies an opening for the scan.',
        0,
      );
    }
  }
  d.index = s.length;
  while (d.openings.length && d.stars.length) {
    d.pair = { open: d.openings.at(-1)!, star: d.stars.at(-1)! };
    emit(
      'pair',
      'Remaining opening ' + d.pair.open + ' / star ' + d.pair.star,
      'while queue and stars:',
      'Try the latest remaining resources.',
      0,
      'Remaining resources',
    );
    const invalid = d.pair.open > d.pair.star;
    emit(
      'compare',
      d.pair.open + ' > ' + d.pair.star + ' → ' + invalid,
      'if queue[-1] > stars[-1]:',
      'A wildcard used as a closing parenthesis must come after the opening.',
      0,
      'Remaining resources',
    );
    if (invalid) return fail(1, 'This star occurs too early to close the remaining opening.');
    d.openings.pop();
    emit(
      'pop-open',
      'Remove remaining opening ' + d.pair.open,
      'queue.pop()',
      'The later star will provide its closing parenthesis.',
      1,
      'Remaining resources',
    );
    d.stars.pop();
    d.roles.find((r) => r.index === d.pair!.star)!.role = 'closing';
    emit(
      'pop-star',
      'Star ' + d.pair.star + ' serves as )',
      'stars.pop()',
      'The index order is valid.',
      1,
      'Remaining resources',
    );
  }
  d.result = d.openings.length === 0;
  if (d.result) for (const role of d.roles) if (role.role === 'pending') role.role = 'empty';
  emit(
    'result',
    'not queue → ' + d.result,
    'return not queue',
    d.result
      ? 'All openings have resources. Unused stars can represent empty strings.'
      : 'Unmatched openings remain. Unused stars cannot repair them.',
  );
  return frames;
}
