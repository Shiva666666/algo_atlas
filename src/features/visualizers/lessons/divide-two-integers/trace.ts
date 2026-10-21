import raw from './reference.py?raw';
import { completeTrace } from '../../core/complete-trace';
import type { Problem } from '../../../../shared/contracts';
import type { DivisionData } from './types';
export const referenceCode = raw.trimEnd();
export function parseInput(raw: string): { dividend: number; divisor: number } {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    throw Error('Use {"dividend":10,"divisor":3}.');
  }
  const valid = (n: unknown) =>
    typeof n === 'number' && Number.isSafeInteger(n) && n >= -(2 ** 31) && n <= 2 ** 31 - 1;
  if (!input || Array.isArray(input) || !valid(input.dividend) || !valid(input.divisor))
    throw Error(
      'dividend and divisor must be signed 32-bit integers (−2147483648 through 2147483647).',
    );
  if (input.divisor === 0)
    throw Error('divisor cannot be zero. Choose a nonzero signed 32-bit integer.');
  return { dividend: input.dividend, divisor: input.divisor };
}
export function createFrames(input: unknown, _problem?: Problem, limit = 12000) {
  const p = parseInput(JSON.stringify(input));
  return completeTrace<DivisionData>(
    referenceCode,
    'divide-two-integers',
    () => ({
      originalDividend: p.dividend,
      originalDivisor: p.divisor,
      dividend: p.dividend,
      divisor: p.divisor,
      i: null,
      res: null,
      isNeg: null,
      overflow: null,
      dividendNegative: null,
      divisorNegative: null,
      checks: [],
      current: null,
      result: null,
      action: '',
      equation: '',
    }),
    (d, emit) => {
      const say = (
        action: string,
        equation: string,
        source: string,
        message: string,
        phase = 'Shift and subtract',
        occurrence = 0,
      ) => emit(action, equation, source, message, true, phase, occurrence);
      d.overflow = p.dividend === -(2 ** 31) && p.divisor === -1;
      say(
        'overflow-check',
        `Overflow guard: ${d.overflow ? 'matched' : 'not matched'}`,
        'if dividend == -2**31 and divisor == -1:',
        'Only −2147483648 divided by −1 exceeds the positive signed 32-bit limit.',
        'Overflow guard',
      );
      if (d.overflow) {
        d.result = 2 ** 31 - 1;
        say(
          'result',
          'Clamp to 2147483647',
          'return 2**31 - 1',
          'Return immediately. Sign normalization and all 32 shift checks are skipped.',
          'Return',
        );
        return;
      }
      d.i = 31;
      say(
        'index-init',
        'i = 31',
        'i = 31',
        'Try the highest quotient bit first, then descend through bit zero.',
        'Normalize signs',
      );
      d.res = 0;
      say(
        'result-init',
        'res = 0',
        'res = 0',
        'The accumulated quotient magnitude starts at zero.',
        'Normalize signs',
      );
      const sign = (n: number) => (BigInt(n) & (1n << 31n)) !== 0n;
      d.isNeg = sign(p.dividend) !== sign(p.divisor);
      say(
        'sign',
        `Different sign bits: ${d.isNeg}`,
        'is_neg = False if (1<<31&dividend) == (1<<31&divisor) else True',
        'Remember the output sign before changing either source argument. A zero quotient still returns 0.',
        'Normalize signs',
      );
      d.dividendNegative = sign(d.dividend);
      say(
        'dividend-sign',
        `Dividend bit 31: ${Number(d.dividendNegative)}`,
        'if (1<<31&dividend):',
        'Within the input domain, bit 31 identifies a negative Python integer.',
        'Normalize signs',
      );
      if (d.dividendNegative) {
        d.dividend = Number(~BigInt(d.dividend) + 1n);
        say(
          'dividend-magnitude',
          `dividend → ${d.dividend}`,
          'dividend = ~dividend + 1',
          'Python ~x + 1 equals −x. The magnitude 2147483648 is valid as an internal value.',
          'Normalize signs',
        );
      }
      d.divisorNegative = sign(d.divisor);
      say(
        'divisor-sign',
        `Divisor bit 31: ${Number(d.divisorNegative)}`,
        'if (1<<31&divisor):',
        'The remembered is_neg does not change during magnitude conversion.',
        'Normalize signs',
      );
      if (d.divisorNegative) {
        d.divisor = Number(~BigInt(d.divisor) + 1n);
        say(
          'divisor-magnitude',
          `divisor → ${d.divisor}`,
          'divisor= ~divisor + 1',
          'The loop compares nonnegative magnitudes; the divisor is now strictly positive.',
          'Normalize signs',
        );
      }
      while (d.i >= 0) {
        d.current = null;
        say(
          'loop',
          `${d.i} > −1: continue`,
          'while i>-1:',
          'The saved source visits every bit, even if the remaining dividend is already zero.',
        );
        // BigInt preserves Python's exact shifts: the candidate can reach 2^62.
        const candidate = BigInt(d.divisor) << BigInt(d.i);
        d.current = {
          bit: d.i,
          candidate: String(candidate),
          before: d.dividend,
          oldRes: d.res,
          fits: candidate <= BigInt(d.dividend),
          state: candidate <= BigInt(d.dividend) ? 'fits' : 'rejected',
        };
        d.checks.push(d.current);
        say(
          'compare',
          `${d.divisor} << ${d.i} = ${candidate} ${d.current.fits ? '≤' : '>'} ${d.dividend}`,
          'if (divisor<<i) > dividend:',
          d.current.fits
            ? 'This chunk fits. Subtract it before writing its quotient bit.'
            : 'This chunk is too large. Leave the quotient bit zero and try the next smaller shift.',
        );
        if (!d.current.fits) {
          d.i--;
          say(
            'next-rejected',
            `i → ${d.i}`,
            'i-=1',
            'Only the shift index changes after a rejection.',
            'Shift and subtract',
            0,
          );
        } else {
          d.dividend = Number(BigInt(d.dividend) - candidate);
          d.current.state = 'subtracted';
          say(
            'subtract',
            `${d.current.before} − ${candidate} = ${d.dividend}`,
            'dividend -= (divisor << i)',
            'Subtraction is complete; the quotient update is still pending. res has not changed yet.',
          );
          d.res += Number(1n << BigInt(d.i));
          d.current.state = 'committed';
          say(
            'commit',
            `${d.current.oldRes} + 2^${d.i} = ${d.res}`,
            'res += 1<<i',
            'Commit this quotient bit. At this boundary, divisor × res + remaining dividend equals the original dividend magnitude.',
          );
          d.i--;
          say(
            'next-accepted',
            `i → ${d.i}`,
            'i-=1',
            'Move to the next lower shift only after both source writes.',
            'Shift and subtract',
            1,
          );
        }
      }
      d.current = null;
      say(
        'loop-end',
        '−1 > −1: stop',
        'while i>-1:',
        'All 32 bits have been checked. The remaining magnitude is smaller than the divisor.',
      );
      d.result = d.res === 0 ? 0 : d.isNeg ? -d.res : d.res;
      say(
        'result',
        `Return ${d.result}`,
        'return res if not is_neg else -res',
        'Apply the remembered sign to the quotient magnitude. Dropping the remaining fraction truncates toward zero, not toward negative infinity.',
        'Return',
      );
    },
    limit,
  );
}
