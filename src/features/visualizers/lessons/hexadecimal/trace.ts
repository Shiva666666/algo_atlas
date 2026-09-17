import type { HexadecimalData } from './types';
export type { HexadecimalData } from './types';
import type { VisualFrame } from '../../core/types';

export function parseInput(raw: string) {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Use {"num":26}.');
  }
  const num = (value as { num?: unknown } | null)?.num;
  if (typeof num !== 'number' || !Number.isInteger(num) || num < -2147483648 || num > 2147483647)
    throw new Error('num must be a signed 32-bit integer (−2147483648 to 2147483647).');
  return { num };
}

export function createHexadecimalFrames(value: unknown): VisualFrame<HexadecimalData>[] {
  const { num } = parseInput(JSON.stringify(value));
  let working: number | null = null;
  let result = '';
  let nibble: number | null = null;
  let digit: string | null = null;
  const frames: VisualFrame<HexadecimalData>[] = [];
  function emit(
    action: HexadecimalData['action'],
    title: string,
    message: string,
    codeFocus: string[],
  ) {
    frames.push({
      kind: 'hexadecimal',
      phase: action,
      title,
      message,
      codeFocus,
      data: { original: num, working, result, nibble, digit, action } satisfies HexadecimalData,
    });
  }
  emit(
    'start',
    `Convert ${num} to hexadecimal`,
    'Keep the original signed input separate from the working 32-bit word.',
    ['if num == 0:'],
  );
  if (num === 0) {
    result = '0';
    emit(
      'zero',
      'Zero has its own return',
      'Return "0" immediately. No masking or digit loop is needed.',
      ['return "0"'],
    );
    return frames;
  }
  working = num >>> 0;
  emit(
    'mask',
    'Keep exactly 32 bits',
    num < 0
      ? `Masking preserves the two’s-complement bit pattern. The working unsigned value is ${working}.`
      : `The input is positive, so masking leaves ${working} unchanged.`,
    ['res = ""', 'hashmap = defaultdict(str)', 'num &= 0xFFFFFFFF'],
  );
  emit(
    'lookup',
    'Build the hexadecimal digit map',
    'Values 0–9 map to their digits; 10–15 map to a–f.',
    [
      'for i in range(10):',
      'hashmap[i] = str(i)',
      'hashmap[10]',
      'hashmap[11]',
      'hashmap[12]',
      'hashmap[13]',
      'hashmap[14]',
      'hashmap[15]',
    ],
  );
  while (working > 0) {
    nibble = working & 15;
    digit = '0123456789abcdef'[nibble];
    emit(
      'extract',
      `Read the last four bits: ${nibble.toString(2).padStart(4, '0')}`,
      `num & 15 = ${nibble}. The lookup gives “${digit}”. This is the expression inside the next assignment.`,
      ['res = hashmap[num & 15] + res'],
    );
    result = digit + result;
    emit(
      'prepend',
      `Prepend “${digit}” to the result`,
      `The least-significant digits were found first, so put the new digit on the left: “${result}”.`,
      ['res = hashmap[num & 15] + res'],
    );
    const old = working;
    working = Math.floor(working / 16);
    nibble = null;
    digit = null;
    emit(
      'shift',
      'Discard the four bits just used',
      `${old} >> 4 = ${working}. The remaining word stays nonnegative after the initial mask.`,
      ['num >>= 4'],
    );
  }
  emit(
    'complete',
    `Result: ${result}`,
    'The working value is zero, so the loop stops. Return the accumulated lowercase digits.',
    ['return res'],
  );
  return frames;
}
