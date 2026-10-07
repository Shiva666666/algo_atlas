import code from './reference.py?raw';
import { referenceWriter } from '../../core/reference-trace';
import type { VisualFrame } from '../../core/types';
import type { RemovalData, Token } from './types';
export const referenceCode = code.trimEnd();
export const MAX_FRAMES = 12000;
export function parseInput(raw: string): { s: string } {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Use JSON such as {"s":"()())()"}.');
  }
  const s =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as { s?: unknown }).s
      : undefined;
  if (typeof s !== 'string' || s.length < 1 || s.length > 12 || !/^[a-z()]+$/.test(s))
    throw new Error(
      'Use 1–12 lowercase letters and parentheses. Reduce the input if its trace exceeds 12,000 steps.',
    );
  return { s };
}
/** Runs the same source operations twice: count first, then allocate independent snapshots. */
export function createFrames(value: unknown): VisualFrame<RemovalData>[] {
  const { s } = parseInput(JSON.stringify(value));
  function run(capture: boolean) {
    const original = [...s].map((value, index) => ({ index, value }));
    const frames: VisualFrame<RemovalData>[] = [];
    const d: RemovalData = {
      s,
      phase: 'budget',
      action: '',
      equation: '',
      readIndex: -1,
      minimum: 0,
      sealed: false,
      countStack: [],
      tokens: original,
      calls: [],
      activeIndex: null,
      deletion: null,
      validation: 'not-run',
      validationReason: 'No candidate checked yet.',
      checkIndex: -1,
      checkStack: [],
      openCount: null,
      closeCount: null,
      seen: [],
      results: [],
      result: null,
    };
    const write = referenceWriter(referenceCode, 'remove-invalid-parentheses', d, frames);
    let count = 0;
    const emit = (
      action: string,
      equation: string,
      snippet: string,
      message: string,
      occurrence = 0,
    ) => {
      if (++count > MAX_FRAMES)
        throw new Error(
          'Trace too large: more than 12,000 steps. Shorten the string and build again; no partial result was applied.',
        );
      if (capture) write(action, equation, snippet, message, occurrence, d.phase);
    };
    emit(
      'initialize',
      'Missing openings = 0',
      'min_num = 0',
      'Count unmatched closing parentheses first.',
    );
    emit(
      'initialize',
      'stack = [] · opening counter',
      'stack = []',
      'This stack initially stores unmatched openings.',
    );
    for (const token of original) {
      d.readIndex = token.index;
      emit(
        'scan',
        'Read ' + token.value,
        'for par in s:',
        'Letters do not affect the removal budget.',
      );
      emit(
        'opening-check',
        token.value + ' == ( → ' + (token.value === '('),
        "if par == '(':",
        'Check the opening branch.',
      );
      if (token.value === '(') {
        d.countStack.push(token);
        emit(
          'count-push',
          'Store unmatched opening',
          'stack.append(par)',
          'An opening can satisfy a later closing parenthesis.',
        );
      } else {
        emit(
          'closing-check',
          token.value + ' == ) → ' + (token.value === ')'),
          "elif par == ')':",
          'Only closers need an available opening.',
        );
        if (token.value === ')') {
          emit(
            'resource-check',
            'Opening available → ' + !!d.countStack.length,
            'if stack:',
            'Match when possible; otherwise one deletion is unavoidable.',
          );
          if (d.countStack.length) {
            d.countStack.pop();
            emit(
              'count-pop',
              'Matched opening removed',
              'stack.pop()',
              'This pair needs no removal.',
            );
          } else {
            d.minimum++;
            emit(
              'missing-opening',
              'Unmatched closers = ' + d.minimum,
              'min_num += 1',
              'This closer cannot be matched by a later opening.',
            );
          }
        } else
          emit(
            'ignore-letter',
            'Keep letter unchanged',
            'continue',
            'Letters are ignored by the count scan.',
            0,
          );
      }
    }
    d.minimum += d.countStack.length;
    d.sealed = true;
    d.readIndex = s.length;
    emit(
      'seal-budget',
      'Minimum removals = ' + d.minimum,
      'min_num += len(stack)',
      'Unmatched closers plus remaining openings form the minimum deletion budget.',
    );
    d.countStack = [];
    emit(
      'clear-stack',
      'stack.clear() · now an answer list',
      'stack.clear()',
      'The Python reuses stack for accepted strings; it is no longer an opening counter.',
    );
    d.phase = 'search';
    emit(
      'initialize-seen',
      'seen = set() · accepted strings only',
      'seen = set()',
      'This set prevents duplicate answers, not duplicate recursive searches.',
    );
    let id = 0;
    function validate(tokens: Token[]): boolean {
      const text = tokens.map((t) => t.value).join('');
      d.phase = 'validation';
      d.validation = 'counts';
      d.validationReason = 'First compare total opening and closing counts.';
      d.checkIndex = -1;
      d.checkStack = [];
      d.openCount = tokens.filter((t) => t.value === '(').length;
      d.closeCount = tokens.filter((t) => t.value === ')').length;
      emit(
        'count-check',
        `${d.openCount} openings vs ${d.closeCount} closers`,
        "if s_loc.count('(') != s_loc.count(')'):",
        'Equal counts are necessary, but prefix order must also be checked.',
      );
      if (d.openCount !== d.closeCount) {
        d.validation = 'invalid';
        d.validationReason = 'Different opening and closing counts.';
        emit('reject-counts', 'Unequal counts → False', 'return False', d.validationReason, 0);
        return false;
      }
      d.validation = 'scanning';
      d.validationReason = 'Counts match. Now every closer must have an earlier opening.';
      emit(
        'check-initialize',
        'loc_stack = []',
        'loc_stack = []',
        'Validate nesting order from left to right.',
      );
      for (let j = 0; j < tokens.length; j++) {
        d.checkIndex = j;
        const token = tokens[j];
        emit(
          'check-read',
          'Check ' + token.value + ' at current index ' + j,
          'for par in s_loc:',
          'Original IDs distinguish equal characters after deletion.',
        );
        emit(
          'check-opening',
          'Opening → ' + (token.value === '('),
          "if par == '(':",
          'Take the matching validator branch.',
          1,
        );
        if (token.value === '(') {
          d.checkStack.push(token);
          emit(
            'check-push',
            'Store validator opening',
            'loc_stack.append(par)',
            'A later closer can consume this opening.',
          );
        } else {
          emit(
            'check-closing',
            'Closing → ' + (token.value === ')'),
            "elif par == ')':",
            'Letters do not need a match.',
            1,
          );
          if (token.value === ')') {
            emit(
              'check-available',
              'No opening → ' + !d.checkStack.length,
              'if not loc_stack:',
              'A prefix with more closers than openings is invalid.',
            );
            if (!d.checkStack.length) {
              d.validation = 'invalid';
              d.validationReason = 'Closing parenthesis has no earlier opening.';
              emit(
                'reject-prefix',
                'Invalid prefix → False',
                'return False',
                d.validationReason,
                1,
              );
              return false;
            }
            d.checkStack.pop();
            emit(
              'check-pop',
              'Matched validator opening',
              'loc_stack.pop()',
              'Consume the most recent unmatched opening.',
            );
          } else
            emit(
              'check-letter',
              'Letter preserved',
              'continue',
              'The validator ignores letters.',
              1,
            );
        }
      }
      d.checkIndex = tokens.length;
      d.validation = d.checkStack.length ? 'invalid' : 'valid';
      d.validationReason = d.checkStack.length
        ? 'Unclosed openings remain.'
        : 'Counts and every prefix are valid.';
      emit(
        'check-result',
        'check(s_loc) → ' + !d.checkStack.length,
        'return True if not loc_stack else False',
        d.validationReason,
      );
      return !d.checkStack.length;
    }
    function visit(tokens: Token[], removes: number, ind: number) {
      const call = {
        id: id++,
        parentId: d.calls.at(-1)?.id ?? null,
        tokens,
        removes,
        ind,
        nextIndex: null as number | null,
      };
      d.calls.push(call);
      d.tokens = tokens;
      d.activeIndex = null;
      d.phase = 'search';
      d.validation = 'not-run';
      d.validationReason = 'Check only at the exact removal budget.';
      d.checkStack = [];
      d.openCount = d.closeCount = null;
      emit(
        'enter',
        `Call ${call.id}: ${removes}/${d.minimum} removals · ind = ${ind}`,
        'def backtrack(removes, max_removes, s_loc, ind):',
        'Each call owns its substring; the caller is unchanged.',
      );
      emit(
        'leaf-check',
        'Budget reached → ' + (removes === d.minimum),
        'if removes == max_removes:',
        'Only candidates with exactly the minimum removals reach validation.',
      );
      if (removes === d.minimum) {
        const text = tokens.map((t) => t.value).join('');
        const duplicate = d.seen.includes(text);
        if (duplicate) {
          d.validation = 'duplicate';
          d.validationReason = 'Already accepted: check(s_loc) is not evaluated.';
        }
        emit(
          'unique-check',
          'Previously accepted → ' + duplicate,
          'if s_loc not in seen and check(s_loc):',
          'Short circuit: an accepted duplicate skips check(s_loc).',
        );
        if (!duplicate && validate(tokens)) {
          d.phase = 'search';
          d.seen.push(text);
          emit(
            'remember',
            'Remember unique valid candidate',
            'seen.add(s_loc)',
            'Only valid answers enter seen.',
          );
          d.results.push(text);
          emit(
            'record',
            'Accept ' + JSON.stringify(text),
            'stack.append(s_loc)',
            'Append this answer in DFS discovery order.',
          );
        }
        d.phase = 'search';
        emit(
          'leaf-return',
          'Return to caller · no boolean result',
          'return',
          'The recursive helper returns control, not True or False.',
          0,
        );
      } else {
        for (let i = ind; i < tokens.length; i++) {
          d.activeIndex = i;
          call.nextIndex = i;
          d.deletion = null;
          emit(
            'candidate',
            'Try current index ' + i + ' · original ID ' + tokens[i].index,
            'for i in range(ind, len(s_loc)):',
            'Current positions change; original character identities do not.',
          );
          const par = tokens[i].value;
          emit(
            'deletion-check',
            'Parenthesis → ' + (par === '(' || par === ')'),
            "if s_loc[i] == '(' or s_loc[i] == ')':",
            'Letters are never removed.',
          );
          if (par === '(' || par === ')') {
            const child = [...tokens.slice(0, i), ...tokens.slice(i + 1)];
            d.deletion = {
              originalIndex: tokens[i].index,
              currentIndex: i,
              nextString: child.map((t) => t.value).join(''),
            };
            emit(
              'delete',
              'Delete ID ' + tokens[i].index + ' · child ind = ' + i,
              'backtrack(removes+1, max_removes, s_loc[:i] + s_loc[i+1:], i)',
              'The next character shifts into index i; the child may remove it next.',
            );
            visit(child, removes + 1, i);
            d.tokens = tokens;
            d.activeIndex = i;
            d.deletion = null;
            d.validation = 'not-run';
            d.validationReason = 'Caller resumed; continue with the next index.';
            d.checkStack = [];
            d.openCount = d.closeCount = null;
            d.phase = 'search';
            emit(
              'resume',
              'Resume parent call ' + call.id,
              'backtrack(removes+1, max_removes, s_loc[:i] + s_loc[i+1:], i)',
              'Parent string is unchanged. Continue exploring; returning does not stop sibling choices.',
            );
          }
        }
        emit(
          'branch-return',
          'All remaining choices explored',
          'return',
          'Return to the caller after completing this loop.',
          1,
        );
      }
      d.calls.pop();
    }
    emit(
      'start-search',
      'Search with budget ' + d.minimum,
      'backtrack(0, min_num, s, 0)',
      'Start at index zero with the original string.',
    );
    visit(original, 0, 0);
    d.tokens = original;
    d.activeIndex = null;
    d.deletion = null;
    d.phase = 'complete';
    d.result = [...d.results];
    emit(
      'result',
      `${d.results.length} unique minimal answers`,
      'return stack',
      'Return all accepted strings; result order is not required by LeetCode.',
    );
    return frames;
  }
  run(false);
  return run(true);
}
