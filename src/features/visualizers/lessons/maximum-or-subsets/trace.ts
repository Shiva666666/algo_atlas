import rawReference from './reference.py?raw';
import type { Problem } from '../../../../shared/contracts';
import { completeTrace, numericArray, type TraceEmit } from '../../core/complete-trace';
import type { OrData, OrCall } from './types';
export const referenceCode = rawReference.trimEnd();
export const parseInput = (raw: string) => numericArray(raw, 8);
function initial(nums: number[]): OrData {
  return {
    action: '',
    equation: '',
    nums: [...nums],
    maxOr: 0,
    targetReady: false,
    scan: null,
    calls: [],
    memo: [],
    memoKey: null,
    cacheHit: null,
    bit: null,
    returned: null,
    result: null,
  };
}
function simulate(d: OrData, emit: TraceEmit) {
  const e: TraceEmit = (a, eq, line, message, checkpoint = true, phase = 'Choice recursion') =>
    emit(a, eq, line, message, checkpoint, phase);
  e(
    'initialize-memo',
    'memo = {}',
    'memo = {}',
    'The sparse table will store counts of continuations.',
    true,
    'Build target',
  );
  e(
    'initialize-target',
    'max_or = 0',
    'max_or = 0',
    'The maximum possible OR is the union of bits from all values.',
    true,
    'Build target',
  );
  for (let index = 0; index < d.nums.length; index++) {
    d.scan = index;
    const old = d.maxOr;
    d.maxOr |= d.nums[index];
    d.bit = { old, value: d.nums[index], next: d.maxOr };
    e(
      'target-or',
      `${old} OR ${d.nums[index]} = ${d.maxOr}`,
      'max_or |= num',
      'OR can add set bits, never remove them.',
      true,
      'Build target',
    );
  }
  d.targetReady = true;
  d.scan = null;
  d.bit = null;
  e(
    'target-ready',
    `Maximum OR target = ${d.maxOr}`,
    'def backtrack(cur_pos, cur_or):',
    'Now count subsets whose OR equals this fixed target.',
    true,
    'Build target',
  );
  let nextId = 0;
  function backtrack(pos: number, or: number, via: OrCall['via'], chosen: number[]): number {
    const call: OrCall = {
      id: nextId++,
      pos,
      or,
      via,
      chosen: [...chosen],
      take: null,
      skip: null,
      returned: null,
    };
    d.calls.push(call);
    d.returned = null;
    d.bit = null;
    d.memoKey = null;
    d.cacheHit = null;
    e(
      'enter',
      `backtrack(${pos}, ${or})`,
      'def backtrack(cur_pos, cur_or):',
      'The state describes where to continue and the OR already collected.',
    );
    const cached = d.memo.find((entry) => entry.pos === pos && entry.or === or);
    d.memoKey = [pos, or];
    d.cacheHit = cached !== undefined;
    e(
      'memo-check',
      `memo[${pos}, ${or}]: ${cached ? cached.count : 'not cached'}`,
      'if (cur_pos, cur_or) in memo:',
      'A stored zero is a computed count, not an absent entry.',
    );
    if (cached) {
      call.returned = cached.count;
      d.returned = cached.count;
      e(
        'memo-hit',
        `Reuse ${cached.count} continuations`,
        'return memo[cur_pos, cur_or]',
        'Reuse the count for this suffix. Distinct earlier index choices still count independently.',
      );
      d.calls.pop();
      return cached.count;
    }
    e(
      'base-check',
      `Position ${pos} ${pos === d.nums.length ? '=' : '≠'} n`,
      'if cur_pos == len(nums):',
      'The memo check happens before the terminal condition.',
    );
    if (pos === d.nums.length) {
      const result = or === d.maxOr ? 1 : 0;
      call.returned = result;
      d.returned = result;
      e(
        'leaf-return',
        `${or} ${result ? '=' : '≠'} ${d.maxOr} → return ${result}`,
        'return 1 if cur_or == max_or else 0',
        'This terminal call returns directly and is not stored in memo.',
      );
      d.calls.pop();
      return result;
    }
    d.bit = { old: or, value: d.nums[pos], next: or | d.nums[pos] };
    e(
      'take',
      `Take index ${pos}: ${or} OR ${d.nums[pos]} = ${d.bit.next}`,
      'take = backtrack(cur_pos + 1, cur_or | nums[cur_pos])',
      'Explore take first. Both branches advance to the next index, so an index is never reused.',
    );
    call.take = backtrack(pos + 1, or | d.nums[pos], 'take', [...chosen, pos]);
    d.bit = null;
    d.memoKey = [pos, or];
    d.cacheHit = null;
    d.returned = call.take;
    e(
      'take-return',
      `Take returned ${call.take}`,
      'take = backtrack(cur_pos + 1, cur_or | nums[cur_pos])',
      'Resume the unchanged caller. The skip count is still pending.',
    );
    d.returned = null;
    e(
      'skip',
      `Skip index ${pos}: keep OR ${or}`,
      'skip = backtrack(cur_pos + 1, cur_or)',
      'Explore the second choice even if take already reached the target.',
    );
    call.skip = backtrack(pos + 1, or, 'skip', chosen);
    d.bit = null;
    d.memoKey = [pos, or];
    d.cacheHit = null;
    d.returned = call.skip;
    e(
      'skip-return',
      `Skip returned ${call.skip}`,
      'skip = backtrack(cur_pos + 1, cur_or)',
      'Both children have now returned to this caller.',
    );
    const result = call.take + call.skip;
    d.memo.push({ pos, or, count: result });
    e(
      'memo-store',
      `${call.take} take + ${call.skip} skip = ${result}`,
      'memo[cur_pos, cur_or] = take + skip',
      'Store a continuation count for this tuple, including zero results.',
    );
    call.returned = result;
    d.returned = result;
    e(
      'return',
      `Return ${call.take} + ${call.skip} = ${result}`,
      'return take + skip',
      'The caller receives the sum of the two distinct choices.',
    );
    d.calls.pop();
    return result;
  }
  d.result = backtrack(0, 0, 'root', []);
  d.returned = d.result;
  d.memoKey = null;
  d.cacheHit = null;
  e(
    'result',
    `Returned subset count: ${d.result}`,
    'return backtrack(0, 0)',
    'All input values are positive, so the empty selection has OR zero and cannot match this target.',
    true,
    'Complete',
  );
}
export function createFrames(input: unknown, _problem?: Problem, limit = 12000) {
  const { nums } = parseInput(JSON.stringify(input));
  return completeTrace(referenceCode, 'maximum-or-subsets', () => initial(nums), simulate, limit);
}
