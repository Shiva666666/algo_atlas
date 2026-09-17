import type { SpecialInput } from './types';
export type { SpecialInput } from './types';
import type { Problem } from '../../../../shared/contracts/index';

import type { InsightModel, IntuitionFrameData, RuleFocus, VisualFrame } from '../../core/types';

export function parseObject(raw: string) {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('Use the JSON shape shown in the example.');
  }
}

export function numericArray(value: unknown, label: string) {
  if (
    !Array.isArray(value) ||
    !value.length ||
    !value.every((item) => Number.isFinite(Number(item)))
  )
    throw new Error(`${label} must be a non-empty numeric array.`);
  if (value.length > 20) throw new Error('Use at most 20 values for a readable trace.');
  return value.map(Number);
}

export function rules(active: string): RuleFocus[] {
  return [
    { token: 'low…high', meaning: 'possible answers', active: active === 'range' },
    { token: 'mid', meaning: 'candidate, not array index', active: active === 'mid' },
    { token: 'feasible(mid)', meaning: 'monotonic yes/no test', active: active === 'test' },
    { token: 'bounds', meaning: 'discard an impossible half', active: active === 'bounds' },
    { token: 'answer', meaning: 'verify the boundary', active: active === 'answer' },
  ];
}

export function frame(
  phase: string,
  title: string,
  message: string,
  insights: InsightModel,
  view: IntuitionFrameData['binarySearch'],
  active: string,
): VisualFrame<IntuitionFrameData> {
  return {
    phase,
    title,
    message,
    kind: 'intuition',
    data: {
      variant: 'binary-search',
      insights,
      rules: rules(active),
      binarySearch: view,
    } satisfies IntuitionFrameData,
  };
}

export const specialInsights: InsightModel = {
  state: 'The candidate x is an answer value between 0 and n; it does not need to appear in nums.',
  base: 'x = 0 and x = n bound every possible count of qualifying elements.',
  choice: 'For a candidate x, count how many values are at least x.',
  invariant: 'count(nums ≥ x) ≥ x changes monotonically from true to false as x grows.',
};

export function parseSpecial(raw: string): SpecialInput {
  const value = parseObject(raw);
  const nums = numericArray(value.nums, 'nums');
  if (nums.some((item) => !Number.isInteger(item) || item < 0))
    throw new Error('nums must contain non-negative integers.');
  return { nums };
}

export function specialFrames(
  value: unknown,
  _problem: Problem,
): VisualFrame<IntuitionFrameData>[] {
  const { nums } = value as SpecialInput;
  let low = 0;
  let high = nums.length;
  const frames: VisualFrame<IntuitionFrameData>[] = [
    frame(
      'BASE',
      'Search the answer value x',
      'Array indices and array values are irrelevant to the search space: x can only be 0…n.',
      specialInsights,
      {
        values: nums,
        low,
        high,
        mid: null,
        metricLabel: 'COUNT ≥ x',
        metric: null,
        verdict: 'not tested',
        answer: null,
        context: `nums [${nums.join(', ')}] · n = ${nums.length}`,
      },
      'range',
    ),
  ];
  let answer = -1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const count = nums.filter((number) => number >= mid).length;
    const verdict =
      count === mid
        ? 'exact equality → return x'
        : count > mid
          ? 'too many → move left = mid + 1'
          : 'too few → move right = mid − 1';
    frames.push(
      frame(
        count === mid ? 'COMPLETE' : 'TEST',
        `Try x = ${mid}`,
        count === mid
          ? `${count} values are at least x, so the reference returns ${mid}.`
          : count > mid
            ? `${count} values qualify, so the answer must be larger than ${mid}.`
            : `Only ${count} values qualify, so ${mid} and larger candidates are impossible.`,
        specialInsights,
        {
          values: nums,
          low,
          high,
          mid,
          metricLabel: 'COUNT ≥ x',
          metric: count,
          verdict,
          answer: count === mid ? mid : null,
          context: `count(nums ≥ ${mid}) = ${count}`,
        },
        count === mid ? 'answer' : 'test',
      ),
    );
    if (count === mid) {
      answer = mid;
      break;
    }
    if (count > mid) low = mid + 1;
    else high = mid - 1;
  }
  if (answer < 0)
    frames.push(
      frame(
        'COMPLETE',
        'No exact x exists',
        'The search exhausted every candidate without count(nums ≥ x) equaling x.',
        specialInsights,
        {
          values: nums,
          low,
          high,
          mid: null,
          metricLabel: 'COUNT ≥ x',
          metric: nums.filter((number) => number >= Math.max(0, low)).length,
          verdict: 'return -1',
          answer: -1,
          context: 'final equality was never found',
        },
        'answer',
      ),
    );
  return frames;
}
