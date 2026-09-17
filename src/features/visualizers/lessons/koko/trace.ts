import type { KokoInput } from './types';
export type { KokoInput } from './types';
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

export const kokoInsights: InsightModel = {
  state: 'low…high contains every eating speed that could still be the minimum valid answer.',
  base: 'Speed 1 is the smallest possible; max(piles) is always fast enough when h ≥ number of piles.',
  choice: 'Test one candidate speed by totaling ceil(pile / speed) hours.',
  invariant: 'Feasibility is monotonic: once a speed works, every faster speed also works.',
};

export function parseKoko(raw: string): KokoInput {
  const value = parseObject(raw);
  const piles = numericArray(value.piles, 'piles');
  const h = Number(value.h);
  if (!Number.isInteger(h) || h < piles.length)
    throw new Error('h must be an integer at least as large as the number of piles.');
  return { piles, h };
}

export function kokoFrames(value: unknown, _problem: Problem): VisualFrame<IntuitionFrameData>[] {
  const { piles, h } = value as KokoInput;
  let low = 1;
  let high = Math.max(...piles);
  const frames: VisualFrame<IntuitionFrameData>[] = [
    frame(
      'BASE',
      'Search speeds, not pile positions',
      'The answer may be any integer speed from 1 through the largest pile.',
      kokoInsights,
      {
        values: piles,
        low,
        high,
        mid: null,
        metricLabel: 'TOTAL HOURS',
        metric: null,
        verdict: 'not tested',
        answer: null,
        context: `piles [${piles.join(', ')}] · h = ${h}`,
      },
      'range',
    ),
  ];
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const hours = piles.reduce((total, pile) => total + Math.ceil(pile / mid), 0);
    const feasible = hours <= h;
    frames.push(
      frame(
        'TEST',
        `Try speed ${mid}`,
        feasible
          ? `${hours} hours fits the deadline. Keep this speed and everything faster; look left for a smaller valid speed.`
          : `${hours} hours misses the deadline. Every slower speed also fails, so move right.`,
        kokoInsights,
        {
          values: piles,
          low,
          high,
          mid,
          metricLabel: 'TOTAL HOURS',
          metric: hours,
          verdict: feasible ? 'feasible → high = mid' : 'too slow → low = mid + 1',
          answer: null,
          context: `Σ ceil(pile / ${mid}) · deadline ${h}`,
        },
        'test',
      ),
    );
    if (feasible) high = mid;
    else low = mid + 1;
  }
  frames.push(
    frame(
      'COMPLETE',
      'First feasible speed found',
      `The search interval collapsed to ${low}.`,
      kokoInsights,
      {
        values: piles,
        low,
        high,
        mid: low,
        metricLabel: 'TOTAL HOURS',
        metric: piles.reduce((total, pile) => total + Math.ceil(pile / low), 0),
        verdict: 'first true',
        answer: low,
        context: `minimum valid speed for h = ${h}`,
      },
      'answer',
    ),
  );
  return frames;
}
