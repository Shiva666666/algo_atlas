import raw from './reference.py?raw';
import { completeTrace } from '../../core/complete-trace';
import type { Problem } from '../../../../shared/contracts';
import type { DecodeData } from './types';
export const referenceCode = raw.trimEnd();
export function parseInput(raw: string): { encoded: number[]; first: number } {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    throw Error('Use {"encoded":[1,2,3],"first":1}.');
  }
  const valid = (v: unknown) =>
    typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= 100000;
  if (
    !input ||
    !Array.isArray(input.encoded) ||
    input.encoded.length < 1 ||
    input.encoded.length > 16
  )
    throw Error('Use 1–16 encoded values and a first value.');
  if (!valid(input.first) || !input.encoded.every(valid))
    throw Error(
      'Encoded values and first must be integers from 0 through 100,000. Repeats and zero are allowed.',
    );
  return { encoded: [...input.encoded], first: input.first };
}
export function createFrames(input: unknown, _problem?: Problem, limit = 12000) {
  const { encoded, first } = parseInput(JSON.stringify(input));
  return completeTrace<DecodeData>(
    referenceCode,
    'decode-xored-array',
    () => ({
      encoded,
      first,
      res: [],
      index: null,
      num: null,
      real: null,
      board: null,
      result: null,
      action: '',
      equation: '',
    }),
    (d, emit) => {
      const say = (a: string, e: string, l: string, m: string) =>
        emit(a, e, l, m, true, 'XOR recovery');
      d.res = [first];
      say(
        'seed',
        `res = [${first}]`,
        'res = [first]',
        'The supplied first value is already known; it is not decoded by XOR.',
      );
      for (let i = 0; i < encoded.length; i++) {
        d.index = i;
        d.num = encoded[i];
        d.board = { encoded: d.num, previous: d.res.at(-1)!, result: null };
        say(
          'read',
          `Read encoded[${i}] = ${d.num}`,
          'for num in encoded:',
          'The source iterates values. The displayed index is a derived teaching pointer.',
        );
        d.real = d.num ^ d.board.previous;
        d.board.result = d.real;
        say(
          'xor',
          `${d.num} XOR ${d.board.previous} = ${d.real}`,
          'real = num^res[-1]',
          'The next value is computed but not appended yet. Equal bits become 0; different bits become 1.',
        );
        d.res.push(d.real);
        say(
          'append',
          `Append ${d.real} to res`,
          'res.append(real)',
          'Commit exactly one new decoded value. The displayed operands are those used before this append.',
        );
      }
      d.result = [...d.res];
      say(
        'return',
        `Return [${d.res.join(', ')}]`,
        'return res',
        'Re-encoding adjacent decoded values reproduces encoded. Results may exceed 100,000; that bound applies to the inputs only.',
      );
    },
    limit,
  );
}
