import type { IpoInput } from './types';
export type { IpoInput } from './types';
import type { Problem } from '../../../../shared/contracts/index';

import type {
  DualHeapView,
  InsightModel,
  IntuitionFrameData,
  RuleFocus,
  VisualFrame,
} from '../../core/types';

export const insights: InsightModel = {
  state:
    'Locked projects are ordered by required capital; the available heap contains profits whose projects are affordable now.',
  base: 'Before any choice, current capital w determines the first affordable frontier.',
  choice: 'Unlock every project with required capital ≤ w, then take the largest available profit.',
  invariant: 'The profit heap contains all and only currently affordable unchosen projects.',
};

export function rules(active: string): RuleFocus[] {
  return [
    { token: 'capital ≤ w', meaning: 'unlock eligibility', active: active === 'unlock' },
    { token: 'capital heap', meaning: 'next project to unlock', active: active === 'locked' },
    { token: 'profit heap', meaning: 'best affordable choice', active: active === 'choose' },
    { token: 'w += profit', meaning: 'grow the frontier', active: active === 'capital' },
    { token: 'empty available', meaning: 'stop safely', active: active === 'stop' },
  ];
}

export function parseInput(raw: string): IpoInput {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Use JSON with k, w, profits, and capital.');
  }
  if (!value || typeof value !== 'object')
    throw new Error('The input needs k, w, profits, and capital.');
  const input = value as Partial<IpoInput>;
  const k = Number(input.k);
  const w = Number(input.w);
  if (!Number.isInteger(k) || k < 0 || !Number.isFinite(w) || w < 0)
    throw new Error('k and w must be non-negative.');
  if (
    !Array.isArray(input.profits) ||
    !Array.isArray(input.capital) ||
    input.profits.length !== input.capital.length ||
    !input.profits.every((item) => Number.isFinite(Number(item))) ||
    !input.capital.every((item) => Number.isFinite(Number(item)))
  )
    throw new Error('profits and capital must be equally sized numeric arrays.');
  if (input.profits.length > 12) throw new Error('Use at most 12 projects for a readable trace.');
  return { k, w, profits: input.profits.map(Number), capital: input.capital.map(Number) };
}

export function frame(
  phase: string,
  title: string,
  message: string,
  view: DualHeapView,
  active: string,
): VisualFrame<IntuitionFrameData> {
  return {
    phase,
    title,
    message,
    kind: 'intuition',
    data: {
      variant: 'dual-heap',
      insights,
      rules: rules(active),
      dualHeap: {
        capital: view.capital,
        round: view.round,
        locked: view.locked.map((project) => ({ ...project })),
        available: [...view.available],
        selected: view.selected,
      },
    } satisfies IntuitionFrameData,
  };
}

export function createFrames(value: unknown, _problem: Problem): VisualFrame<IntuitionFrameData>[] {
  const input = value as IpoInput;
  let w = input.w;
  const locked = input.capital
    .map((capital, index) => ({ capital, profit: input.profits[index] }))
    .sort((a, b) => a.capital - b.capital || b.profit - a.profit);
  const available: number[] = [];
  const frames: VisualFrame<IntuitionFrameData>[] = [
    frame(
      'STATE',
      'Separate eligibility from choice',
      'One ordering answers “what can enter?”; the other answers “what should I take?”.',
      { capital: w, round: 0, locked, available, selected: null },
      'locked',
    ),
  ];
  for (let round = 1; round <= input.k; round += 1) {
    const unlocked = [] as Array<{ capital: number; profit: number }>;
    while (locked.length && locked[0].capital <= w) {
      const project = locked.shift()!;
      unlocked.push(project);
      available.push(project.profit);
    }
    available.sort((a, b) => b - a);
    frames.push(
      frame(
        'UNLOCK',
        `Round ${round}: expose affordable projects`,
        unlocked.length
          ? `${unlocked.map((project) => `cap ${project.capital} → +${project.profit}`).join(', ')} moved into the profit heap.`
          : `No locked project has capital ≤ ${w}.`,
        { capital: w, round, locked, available, selected: null },
        'unlock',
      ),
    );
    if (!available.length) {
      frames.push(
        frame(
          'STOP',
          'No affordable project remains',
          'Pushing an unaffordable project back into the same profit heap would repeat forever. Stop instead.',
          { capital: w, round, locked, available, selected: null },
          'stop',
        ),
      );
      break;
    }
    const selected = available.shift()!;
    frames.push(
      frame(
        'GREEDY CHOICE',
        `Take profit ${selected}`,
        'Every available project is feasible, so the largest profit produces at least as much capital for every future round.',
        { capital: w, round, locked, available: [selected, ...available], selected },
        'choose',
      ),
    );
    w += selected;
    frames.push(
      frame(
        'UPDATE',
        `Capital becomes ${w}`,
        'The larger frontier may unlock more projects next round.',
        { capital: w, round, locked, available, selected: null },
        'capital',
      ),
    );
  }
  frames.push(
    frame(
      'COMPLETE',
      'Maximum reachable capital',
      `Finish with capital ${w}.`,
      {
        capital: w,
        round: Math.min(input.k, input.profits.length),
        locked,
        available,
        selected: null,
      },
      'capital',
    ),
  );
  return frames;
}
