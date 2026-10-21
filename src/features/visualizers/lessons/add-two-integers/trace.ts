import raw from './reference.py?raw';
import { completeTrace } from '../../core/complete-trace';
import type { Problem } from '../../../../shared/contracts';
import type { AdditionData } from './types';
export const referenceCode = raw.trimEnd();
export function parseInput(raw: string): { num1: number; num2: number } {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    throw Error('Use {"num1":12,"num2":5}.');
  }
  const valid = (value: unknown) =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= -100 && value <= 100;
  if (!input || Array.isArray(input) || !valid(input.num1) || !valid(input.num2))
    throw Error('num1 and num2 must each be integers from −100 through 100.');
  return { num1: input.num1, num2: input.num2 };
}
export function createFrames(input: unknown, _problem?: Problem, limit = 12000) {
  const { num1, num2 } = parseInput(JSON.stringify(input));
  return completeTrace<AdditionData>(
    referenceCode,
    'add-two-integers',
    () => ({
      num1,
      num2,
      res: null,
      carry: null,
      i: null,
      a: null,
      b: null,
      sumBit: null,
      column: null,
      written: 0,
      signSet: null,
      complement: null,
      result: null,
      action: '',
      equation: '',
    }),
    (d, emit) => {
      const say = (
        action: string,
        equation: string,
        line: string,
        message: string,
        phase = 'Bit columns',
      ) => emit(action, equation, line, message, true, phase);
      d.res = 0;
      say(
        'result-init',
        'res = 0',
        'res = 0',
        'All 32 result bits start at zero. Unwritten bits are initialized, not finalized.',
        'Initialize',
      );
      d.carry = 0;
      say(
        'carry-init',
        'carry = 0',
        'carry = 0',
        'No carry enters the least significant column.',
        'Initialize',
      );
      for (let i = 0; i < 32; i++) {
        d.i = i;
        d.column = {
          index: i,
          a: null,
          b: null,
          carryIn: d.carry,
          sumBit: null,
          carryOut: null,
          oldRes: d.res,
        };
        say(
          'column',
          `Visit bit ${i} · weight 2^${i}`,
          'for i in range(32):',
          'Process bits from 0 through 31, moving from least to most significant.',
        );
        d.a = Number((BigInt(num1) >> BigInt(i)) & 1n);
        d.column.a = d.a;
        say(
          'read-a',
          `a = (${num1} >> ${i}) & 1 = ${d.a}`,
          'a = (num1 >> i) & 1',
          'Python right shift preserves the sign. The diagram shows the low 32 bits of each signed input.',
        );
        d.b = Number((BigInt(num2) >> BigInt(i)) & 1n);
        d.column.b = d.b;
        say(
          'read-b',
          `b = (${num2} >> ${i}) & 1 = ${d.b}`,
          'b = (num2 >> i) & 1',
          'Both input bits are now read. Neither sum_bit nor the outgoing carry has been recomputed yet.',
        );
        d.sumBit = d.a ^ d.b ^ d.carry;
        d.column.sumBit = d.sumBit;
        say(
          'sum-bit',
          `${d.a} XOR ${d.b} XOR ${d.carry} = ${d.sumBit}`,
          'sum_bit = a ^ b ^ carry',
          'This sum bit uses the incoming carry. The source carry is still unchanged.',
        );
        d.carry = (d.a & d.b) | ((d.a ^ d.b) & d.carry);
        d.column.carryOut = d.carry;
        say(
          'carry-out',
          `Carry out = (${d.a} AND ${d.b}) OR ((${d.a} XOR ${d.b}) AND ${d.column.carryIn}) = ${d.carry}`,
          'carry = (a & b) | ((a ^ b) & carry)',
          'Carry changes after sum_bit. The captured carry-in remains visible; it is the old value used by both formulas.',
        );
        d.res = Number(BigInt(d.res) | (BigInt(d.sumBit) << BigInt(i)));
        d.written = i + 1;
        say(
          'write-bit',
          `Write bit ${i} = ${d.sumBit} · res ${d.column.oldRes} → ${d.res}`,
          'res |= (sum_bit << i)',
          'Only this bit is committed by the OR write. A zero is also a completed write, not an unvisited bit.',
        );
      }
      d.signSet = (BigInt(d.res) & (1n << 31n)) !== 0n;
      say(
        'sign-check',
        `Bit 31 is ${d.signSet ? 1 : 0} · ${d.signSet ? 'decode negative' : 'non-negative result'}`,
        'if res & (1 << 31):',
        'The source res is an unsigned working word. Only after all 32 writes does the sign-bit branch interpret it. A carry beyond bit 31 is not added.',
        'Signed result',
      );
      if (d.signSet) {
        d.complement = Number(BigInt(d.res) ^ 0xffffffffn);
        d.result = Number(~BigInt(d.complement));
        say(
          'return-negative',
          `~(${d.res} XOR 0xFFFFFFFF) = ~${d.complement} = ${d.result}`,
          'return ~(res ^ 0xFFFFFFFF)',
          'Python bitwise NOT means −x − 1. This is equivalent to working res − 2^32; it does not change the stored res.',
          'Signed result',
        );
      } else {
        d.result = d.res;
        say(
          'return-positive',
          `Return ${d.result}`,
          'return res',
          'Bit 31 is zero, so return the non-negative working word unchanged.',
          'Signed result',
        );
      }
    },
    limit,
  );
}
