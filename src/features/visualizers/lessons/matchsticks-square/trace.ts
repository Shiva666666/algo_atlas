import type {
  MatchsticksInput,
  MatchstickSide,
  MatchsticksAction,
  MatchstickChoiceState,
  MatchstickChoice,
  MatchstickCall,
  MatchsticksFrameData,
} from './types';
export type {
  MatchsticksInput,
  MatchstickSide,
  MatchsticksAction,
  MatchstickChoiceState,
  MatchstickChoice,
  MatchstickCall,
  MatchsticksFrameData,
} from './types';
import type { Problem } from '../../../../shared/contracts/index';

import type { VisualFrame } from '../../core/types';

export const SIDES: MatchstickSide[] = ['left', 'right', 'top', 'down'];

export const MAX_STICKS = 8;

export const MAX_FRAMES = 12000;

export function cloneSums(value: Record<MatchstickSide, number>): Record<MatchstickSide, number> {
  return { left: value.left, right: value.right, top: value.top, down: value.down };
}

export function cloneSticks(
  value: Record<MatchstickSide, number[]>,
): Record<MatchstickSide, number[]> {
  return {
    left: [...value.left],
    right: [...value.right],
    top: [...value.top],
    down: [...value.down],
  };
}

export function cloneChoices(value: MatchstickChoice[]): MatchstickChoice[] {
  return value.map((choice) => ({ ...choice }));
}

export function parseMatchsticksInput(raw: string): MatchsticksInput {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Use {"matchsticks":[1,1,2,2,2]} or paste a numeric array.');
  }
  const list = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? (value as { matchsticks?: unknown }).matchsticks
      : undefined;
  if (!Array.isArray(list)) throw new Error('Input must contain a matchsticks array.');
  if (list.length < 1 || list.length > MAX_STICKS)
    throw new Error(`Use 1–${MAX_STICKS} positive sticks for a readable trace.`);
  if (!list.every((item) => typeof item === 'number' && Number.isSafeInteger(item) && item > 0))
    throw new Error('Every matchstick must be a positive safe integer.');
  const matchsticks = [...(list as number[])];
  const total = matchsticks.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(total))
    throw new Error('The matchstick total exceeds the safe integer range.');
  return { matchsticks };
}

export function makeData(
  input: MatchsticksInput,
  state: Omit<
    MatchsticksFrameData,
    'original' | 'sorted' | 'total' | 'sideSums' | 'sideSticks' | 'stack' | 'choices'
  >,
  sorted: Array<{ id: number; value: number }>,
  total: number,
  sums: Record<MatchstickSide, number>,
  sticks: Record<MatchstickSide, number[]>,
  stack: MatchstickCall[],
  choices: MatchstickChoice[],
): MatchsticksFrameData {
  return {
    ...state,
    original: [...input.matchsticks],
    sorted: sorted.map((item) => ({ ...item })),
    total,
    sideSums: cloneSums(sums),
    sideSticks: cloneSticks(sticks),
    stack: stack.map((call) => ({ ...call, sums: cloneSums(call.sums) })),
    choices: cloneChoices(choices),
  };
}

export function createMatchsticksFrames(
  value: unknown,
  _problem?: Problem,
): VisualFrame<MatchsticksFrameData>[] {
  const input = parseMatchsticksInput(JSON.stringify(value));
  const total = input.matchsticks.reduce((sum, item) => sum + item, 0);
  const target = Math.floor(total / 4);
  const sorted = input.matchsticks
    .map((value, id) => ({ id, value }))
    .sort((a, b) => a.value - b.value)
    .reverse();
  const frames: VisualFrame<MatchsticksFrameData>[] = [];
  const sums: Record<MatchstickSide, number> = { left: 0, right: 0, top: 0, down: 0 };
  const sticks: Record<MatchstickSide, number[]> = { left: [], right: [], top: [], down: [] };
  const stack: MatchstickCall[] = [];
  let nextCallId = 0;
  let activeChoices: MatchstickChoice[] = SIDES.map((side) => ({
    side,
    state: 'untried',
    candidateSum: 0,
    fits: null,
  }));
  let activeSide: MatchstickSide | null = null;
  let candidateSum: number | null = null;
  let childResult: boolean | null = null;
  let result: boolean | null = null;
  let winningSums: Record<MatchstickSide, number> | null = null;
  let winningSticks: Record<MatchstickSide, number[]> | null = null;
  const emit = (
    action: MatchsticksAction,
    phase: string,
    title: string,
    message: string,
    codeFocus: string[],
    messageKey: string,
    codeLines?: number[],
  ) => {
    if (frames.length >= MAX_FRAMES)
      throw new Error(
        `Trace too large. Try a smaller input (maximum ${MAX_FRAMES.toLocaleString()} frames).`,
      );
    const current = stack.at(-1);
    const data = makeData(
      input,
      {
        target,
        index: current?.index ?? 0,
        currentStick: current ? (sorted[current.index] ?? null) : null,
        callId: current?.id ?? null,
        parentId: current?.parentId ?? null,
        activeSide,
        candidateSum,
        childResult,
        action,
        result,
        messageKey,
      },
      sorted,
      total,
      sums,
      sticks,
      stack,
      activeChoices,
    );
    frames.push({ kind: 'matchsticks-square', phase, title, message, codeFocus, codeLines, data });
  };

  emit(
    'target',
    'SETUP',
    `Target side length = ${target}`,
    `The total is ${total}; a square needs four equal sides, so target = floor(${total} / 4).`,
    ['target = sum(matchsticks) // 4'],
    'target',
    [4],
  );
  if (total % 4 !== 0) {
    result = false;
    emit(
      'divisibility',
      'GUARD',
      'Stop: total is not divisible by 4',
      `${total} % 4 ≠ 0, so four equal sides are impossible.`,
      ['if sum(matchsticks) % 4 != 0:'],
      'divisibility',
      [6, 7],
    );
    emit(
      'complete',
      'RESULT',
      'Return False',
      'The search never starts because the target cannot be shared equally.',
      ['return False'],
      'complete',
      [7],
    );
    return frames;
  }
  emit(
    'sort',
    'PREPARE',
    'Sort the sticks',
    'Sort ascending first, matching the saved solution.',
    ['matchsticks.sort()'],
    'sort',
    [9],
  );
  emit(
    'reverse',
    'PREPARE',
    'Reverse for largest-first search',
    'Reverse the sorted list so difficult large sticks are placed early.',
    ['matchsticks.reverse()'],
    'reverse',
    [10],
  );

  const backtrack = (index: number, parentId: number | null): boolean => {
    const callId = nextCallId++;
    const call: MatchstickCall = {
      id: callId,
      parentId,
      index,
      sums: cloneSums(sums),
      activeSide: null,
      result: null,
    };
    stack.push(call);
    activeChoices = SIDES.map((side) => ({
      side,
      state: 'untried',
      candidateSum: index < sorted.length ? sums[side] + sorted[index].value : sums[side],
      fits: null,
    }));
    activeSide = null;
    candidateSum = null;
    childResult = null;
    emit(
      'call',
      'CALL',
      `backtrack(${index}, ${sums.left}, ${sums.right}, ${sums.top}, ${sums.down})`,
      `The recursive state carries four scalar side totals. A child receives copies of these values.`,
      ['def backtrack(i, left, right, top, down):'],
      'call',
      [12],
    );
    if (index === sorted.length) {
      const equal = sums.left === sums.right && sums.right === sums.top && sums.top === sums.down;
      result = equal;
      call.result = equal;
      if (equal) {
        winningSums = cloneSums(sums);
        winningSticks = cloneSticks(sticks);
      }
      emit(
        equal ? 'base-success' : 'base-failure',
        'BASE',
        equal ? 'All sticks placed: sides match' : 'All sticks placed: sides do not match',
        equal
          ? 'Every side is complete, so this path succeeds.'
          : 'This complete assignment is not a square; return False to the parent.',
        [equal ? 'return True' : 'return False'],
        'base',
        [equal ? 15 : 17],
      );
      stack.pop();
      if (equal) {
        emit(
          'return-success',
          'RETURN',
          'Propagate True',
          'A successful child lets every caller return True immediately.',
          ['return True'],
          'return-success',
          [21],
        );
      } else
        emit(
          'return-failure',
          'RETURN',
          'Resume parent state',
          'This child failed; the caller may still try its next side.',
          ['return False'],
          'return-failure',
          [17, 18],
        );
      return equal;
    }
    const stick = sorted[index];
    for (const side of SIDES) {
      activeSide = side;
      candidateSum = sums[side] + stick.value;
      const choice = activeChoices.find((item) => item.side === side)!;
      choice.state = 'checking';
      choice.candidateSum = candidateSum;
      choice.fits = candidateSum <= target;
      emit(
        'check',
        'CHOICE',
        `${side} + ${stick.value} = ${candidateSum}`,
        candidateSum <= target
          ? `The stick fits on ${side}; explore this child before deciding the other sides.`
          : `${side} would exceed target ${target}; positive lengths make this branch impossible.`,
        [`${side} + matchsticks[i] <= target`],
        'check',
        side === 'left' ? [20] : side === 'right' ? [23] : side === 'top' ? [27] : [30],
      );
      if (candidateSum > target) {
        choice.state = 'pruned';
        emit(
          'prune',
          'PRUNE',
          `Prune ${side}: over capacity`,
          `No later positive stick can reduce ${side} from ${candidateSum} back to ${target}.`,
          [`${side} + matchsticks[i] <= target`],
          'prune',
          side === 'left' ? [20] : side === 'right' ? [23] : side === 'top' ? [27] : [30],
        );
        continue;
      }
      choice.state = 'exploring';
      sticks[side].push(stick.id);
      sums[side] += stick.value;
      call.activeSide = side;
      emit(
        'explore',
        'BRANCH',
        `Place stick ${stick.value} on ${side}`,
        `Try one legal choice. A legal choice is only a branch to explore, not a commitment to the answer.`,
        ['if backtrack(i+1'],
        'explore',
        side === 'left' ? [21] : side === 'right' ? [24] : side === 'top' ? [28] : [31],
      );
      const child = backtrack(index + 1, callId);
      childResult = child;
      sums[side] -= stick.value;
      sticks[side].pop();
      call.activeSide = null;
      if (child) {
        choice.state = 'successful';
        result = true;
        call.result = true;
        activeSide = side;
        candidateSum = sums[side] + stick.value;
        emit(
          'return-success',
          'RETURN',
          `Success from ${side}`,
          `The child solved the remaining sticks, so this caller returns True.`,
          ['return True'],
          'return-success',
          side === 'left' ? [22] : side === 'right' ? [25] : side === 'top' ? [29] : [32],
        );
        stack.pop();
        return true;
      }
      choice.state = 'failed';
      activeSide = side;
      candidateSum = sums[side] + stick.value;
      emit(
        'resume',
        'BACKTRACK',
        `Resume parent; try the next side`,
        `The ${side} branch returned False. Parent totals are unchanged, so another legal side can be explored.`,
        ['if backtrack(i+1'],
        'resume',
        side === 'left' ? [21] : side === 'right' ? [24] : side === 'top' ? [28] : [31],
      );
    }
    result = false;
    call.result = false;
    activeSide = null;
    candidateSum = null;
    emit(
      'return-failure',
      'RETURN',
      'All four choices failed',
      'Only after every side is rejected or exhausted does this call return False.',
      ['return False'],
      'return-failure',
      [33],
    );
    stack.pop();
    return false;
  };
  const solved = backtrack(0, null);
  result = solved;
  if (solved && winningSums && winningSticks) {
    Object.assign(sums, winningSums);
    Object.assign(sticks, winningSticks);
  }
  activeChoices = SIDES.map((side) => ({
    side,
    state: solved ? 'successful' : 'failed',
    candidateSum: sums[side],
    fits: solved,
  }));
  emit(
    'complete',
    'RESULT',
    solved ? 'Square found' : 'No square assignment',
    solved
      ? `Solved with target ${target}: left ${sums.left}, right ${sums.right}, top ${sums.top}, down ${sums.down}.`
      : 'Every explored assignment failed; return False.',
    [solved ? 'return backtrack(0,0,0,0,0)' : 'return False'],
    'complete',
    solved ? [36] : [34],
  );
  return frames;
}

export const defaultInput = [1, 1, 2, 2, 2];
