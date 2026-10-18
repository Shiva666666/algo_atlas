import code from './reference.py?raw';
import { completeTrace, numericArray } from '../../core/complete-trace';
import type { Problem } from '../../../../shared/contracts/index';
import type { DigitSumSwapData } from './types';

export const referenceCode = code.trimEnd();
export const parseInput = (raw: string) =>
  numericArray(raw, 12, { maximumValue: 1000000000, distinct: true });

export function createFrames(input: unknown, _problem?: Problem, limit = 12000) {
  const { nums } = parseInput(JSON.stringify(input));
  return completeTrace<DigitSumSwapData>(
    referenceCode,
    'minimum-swaps-digit-sum',
    () => ({
      original: [...nums],
      nums: [...nums],
      keys: nums.map(() => null),
      target: null,
      helper: null,
      pos: null,
      i: null,
      j: null,
      count: null,
      confirmed: 0,
      swap: null,
      history: [],
      result: null,
      action: '',
      equation: '',
    }),
    (d, emit) => {
      const sortedLine = 'sorted_nums = sorted(nums, key=lambda x: (add_digits(x), x))';
      const say = (
        action: string,
        equation: string,
        source: string,
        message: string,
        phase: string,
        occurrence = 0,
      ) => emit(action, equation, source, message, true, phase, occurrence);
      say(
        'sort-start',
        'Build (digit sum, value) keys',
        sortedLine,
        'Python evaluates the key once for each input value. The reference Python remains text; this is a local simulation.',
        'Digit sums',
      );
      for (let inputIndex = 0; inputIndex < nums.length; inputIndex++) {
        const value = nums[inputIndex];
        d.helper = {
          inputIndex,
          value,
          remaining: value,
          total: 0,
          digit: null,
          oldTotal: 0,
          oldRemaining: value,
        };
        const h = d.helper;
        say(
          'helper-enter',
          `add_digits(${value})`,
          'def add_digits(i):',
          'This helper’s local i is the remaining number, not the outer array index.',
          'Digit sums',
        );
        say(
          'helper-init',
          'total = 0',
          'total = 0',
          'Start a separate total for this number.',
          'Digit sums',
        );
        while (true) {
          h.digit = null;
          say(
            'digit-check',
            `while i: ${h.remaining !== 0}`,
            'while i:',
            h.remaining ? 'Extract the rightmost digit next.' : 'No digits remain; return the sum.',
            'Digit sums',
          );
          if (!h.remaining) break;
          h.oldTotal = h.total;
          h.oldRemaining = h.remaining;
          h.digit = h.remaining % 10;
          h.total += h.digit;
          say(
            'digit-add',
            `${h.oldTotal} + ${h.remaining} % 10 = ${h.total}`,
            'total += i % 10',
            'The extracted digit is a teaching annotation of the modulo expression, not another source variable.',
            'Digit sums',
          );
          h.remaining = Math.floor(h.remaining / 10);
          say(
            'digit-shift',
            `i = ${h.oldRemaining} // 10 = ${h.remaining}`,
            'i //= 10',
            'Discard exactly the rightmost digit. Zeros still take a loop iteration.',
            'Digit sums',
          );
        }
        d.keys[inputIndex] = h.total;
        say(
          'key-return',
          `add_digits(${value}) returns ${h.total}`,
          'return total',
          `The completed sorting key is (${h.total}, ${value}).`,
          'Digit sums',
        );
      }
      const key = new Map(d.original.map((value, i) => [value, d.keys[i]!]));
      d.helper = null;
      d.target = [...nums].sort((a, b) => key.get(a)! - key.get(b)! || a - b);
      say(
        'target',
        'Target order established',
        sortedLine,
        'Sort ascending by digit sum, then by numeric value. No invented comparison loop is traced.',
        'Target order',
      );
      d.pos = {};
      say(
        'map-init',
        'pos = {}',
        'pos = {}',
        'The map is empty; an unrecorded value has no stored index yet.',
        'Position map',
      );
      for (let i = 0; i < d.nums.length; i++) {
        d.i = i;
        say(
          'map-index',
          `Build map at index ${i}`,
          'for i in range(len(nums)):',
          'Record the current position of each distinct value.',
          'Position map',
        );
        d.pos[d.nums[i]] = i;
        say(
          'map-store',
          `pos[${d.nums[i]}] = ${i}`,
          'pos[nums[i]] = i',
          'The map is being built in input order.',
          'Position map',
        );
      }
      d.count = 0;
      say(
        'count-init',
        'count = 0',
        'count = 0',
        'No exchanges have happened yet.',
        'Fix positions',
      );
      for (let i = 0; i < d.nums.length; i++) {
        d.i = i;
        d.swap = null;
        say(
          'position',
          `Check position ${i}`,
          'for i in range(len(nums)):',
          'Positions before i form the confirmed prefix. j retains its last assigned source value until another lookup.',
          'Fix positions',
          1,
        );
        const required: number = d.target[i];
        const displaced: number = d.nums[i];
        const mismatch = displaced !== required;
        say(
          'compare',
          `${displaced} != ${required}: ${mismatch}`,
          'if nums[i] != sorted_nums[i]:',
          mismatch
            ? 'Find the required value in the position map.'
            : 'This value already occupies its target position; do not swap or increment count.',
          'Fix positions',
        );
        if (mismatch) {
          const j = d.pos[required];
          d.j = j;
          d.swap = { i, j, required, displaced, writes: [], stage: 'located' };
          say(
            'lookup',
            `j = pos[${required}] = ${j}`,
            'j = pos[sorted_nums[i]]',
            'The required value lives at j. This is an arbitrary-position swap, not an adjacent swap.',
            'Fix positions',
          );
          d.swap.writes.push({ value: displaced, before: d.pos[displaced], after: j });
          d.pos[displaced] = j;
          d.swap.stage = 'prepared-one';
          say(
            'map-first',
            `pos[${displaced}] = ${j}`,
            'pos[nums[i]] = j',
            'First position update prepared. The array has not moved; the map is temporarily ahead of it.',
            'Fix positions',
          );
          d.swap.writes.push({ value: required, before: d.pos[required], after: i });
          d.pos[required] = i;
          d.swap.stage = 'prepared-both';
          say(
            'map-second',
            `pos[${required}] = ${i}`,
            'pos[sorted_nums[i]] = i',
            'Position updates prepared; swap pending. Do not eagerly change nums.',
            'Fix positions',
          );
          [d.nums[i], d.nums[j]] = [d.nums[j], d.nums[i]];
          d.swap.stage = 'swapped';
          d.history.push({ i, j, displaced, required });
          say(
            'swap',
            `Swap positions ${i} ↔ ${j}`,
            'nums[i], nums[j] = nums[j], nums[i]',
            'The tuple assignment exchanges both values atomically. The source count updates next.',
            'Fix positions',
          );
          d.count++;
          d.swap.stage = 'counted';
          d.confirmed = i + 1;
          say(
            'confirmed',
            `count = ${d.count}; position ${i} confirmed`,
            'count += 1',
            'Count exactly one completed exchange. The confirmed-prefix length is a derived progress annotation.',
            'Fix positions',
          );
        } else {
          d.confirmed = i + 1;
          say(
            'confirmed',
            `Position ${i} confirmed · no swap`,
            'if nums[i] != sorted_nums[i]:',
            'Continue to the next index with count unchanged. Prefix confirmation is a teaching annotation.',
            'Fix positions',
          );
        }
      }
      d.result = d.count;
      say(
        'return',
        `Return minimum swaps: ${d.count}`,
        'return count',
        'nums now matches the target. The return value is the minimum number of arbitrary-position exchanges.',
        'Result',
      );
    },
    limit,
  );
}
