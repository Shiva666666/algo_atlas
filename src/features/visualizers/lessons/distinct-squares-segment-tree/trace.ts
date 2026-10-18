import rawReference from './reference.py?raw';
import type { Problem } from '../../../../shared/contracts';
import { completeTrace, numericArray, type TraceEmit } from '../../core/complete-trace';
import type { SquaresData, TreeNode } from './types';

export const referenceCode = rawReference.trimEnd();
export const MOD = 1000000007;
export const parseInput = (raw: string) => numericArray(raw, 12);
export function squareIncrement(oldSum: number, oldSquare: number, length: number, val: number) {
  return {
    sum: (oldSum + length * val) % MOD,
    square: (oldSquare + 2 * val * oldSum + length * val * val) % MOD,
  };
}
function topology(n: number): TreeNode[] {
  const nodes: TreeNode[] = [];
  function visit(i: number, l: number, r: number) {
    nodes.push({ i, l, r });
    if (l !== r) {
      const m = (l + r) >> 1;
      visit(2 * i + 1, l, m);
      visit(2 * i + 2, m + 1, r);
    }
  }
  visit(0, 0, n - 1);
  return nodes;
}
function initial(nums: number[]): SquaresData {
  return {
    action: '',
    equation: '',
    nums: [...nums],
    right: -1,
    num: null,
    prev: null,
    range: null,
    last: {},
    sum: [],
    square: [],
    lazy: [],
    nodes: topology(nums.length),
    calls: [],
    active: null,
    coverage: null,
    operation: null,
    transfer: null,
    committed: nums.map(() => 0),
    committedRight: -1,
    preview: null,
    res: 0,
    result: null,
    updating: false,
    contributions: [],
  };
}
function simulate(d: SquaresData, emit: TraceEmit) {
  const n = d.nums.length;
  let nextId = 0;
  const e: TraceEmit = (
    a,
    eq,
    line,
    message,
    checkpoint = false,
    phase = 'Range update',
    occurrence = 0,
  ) => emit(a, eq, line, message, checkpoint, phase, occurrence);
  e(
    'length',
    `n = ${n}`,
    'n = len(nums)',
    'Every leaf will represent one possible starting index.',
    false,
    'Initialize',
  );
  e(
    'modulus',
    `MOD = ${MOD}`,
    'MOD = 10**9 + 7',
    'Store sums and squared sums modulo MOD.',
    false,
    'Initialize',
  );
  d.sum = Array(4 * n).fill(0);
  e(
    'initialize-sum',
    'Initialize sum_tree',
    'sum_tree = [0] * (4 * n)',
    'All counts initially contribute zero.',
    false,
    'Initialize',
  );
  d.square = Array(4 * n).fill(0);
  e(
    'initialize-square',
    'Initialize sq_tree',
    'sq_tree = [0] * (4 * n)',
    'Squared contributions also start at zero.',
    false,
    'Initialize',
  );
  d.lazy = Array(4 * n).fill(0);
  e(
    'initialize-lazy',
    'Initialize lazy tags',
    'lazy = [0] * (4 * n)',
    'Only actual interval nodes are drawn; the Python allocates 4n slots.',
    true,
    'Initialize',
  );
  e(
    'initialize-last',
    'last = {}',
    'last = {}',
    'No value has a previous occurrence yet.',
    false,
    'Initialize',
  );
  e(
    'initialize-result',
    'res = 0',
    'res = 0',
    'Endpoint contributions will be accumulated here.',
    true,
    'Initialize',
  );
  function enter(fn: 'apply' | 'push' | 'update', i: number, l: number, r: number, val: number) {
    d.calls.push({ id: nextId++, fn, i, l, r, val });
    d.active = i;
  }
  function leave() {
    d.calls.pop();
    d.active = d.calls.at(-1)?.i ?? null;
  }
  function apply(i: number, l: number, r: number, val: number) {
    enter('apply', i, l, r, val);
    const length = r - l + 1;
    d.operation = {
      i,
      l,
      r,
      val,
      length,
      oldSum: d.sum[i],
      oldSquare: d.square[i],
      oldLazy: d.lazy[i],
    };
    e(
      'apply-length',
      `L = ${r} − ${l} + 1 = ${length}`,
      'length = r - l + 1',
      'Use this interval length in both aggregate formulas.',
    );
    const old = { ...d.operation };
    d.square[i] += 2 * val * old.oldSum + length * val * val;
    e(
      'apply-square',
      `Q = ${old.oldSquare} + 2 × ${val} × ${old.oldSum} + ${length} × ${val}² = ${d.square[i]}`,
      'sq_tree[i] += (',
      'The squared-sum update uses the OLD sum, before sum_tree changes.',
    );
    d.sum[i] += length * val;
    e(
      'apply-sum',
      `S = ${old.oldSum} + ${length} × ${val} = ${d.sum[i]}`,
      'sum_tree[i] += length * val',
      'Now update the ordinary sum.',
    );
    d.square[i] %= MOD;
    e(
      'apply-square-mod',
      `Q mod MOD = ${d.square[i]}`,
      'sq_tree[i] %= MOD',
      'Normalize the squared sum.',
    );
    d.sum[i] %= MOD;
    e(
      'apply-sum-mod',
      `S mod MOD = ${d.sum[i]}`,
      'sum_tree[i] %= MOD',
      'Normalize the ordinary sum.',
    );
    d.lazy[i] += val;
    e(
      'apply-complete',
      `lazy[${i}] = ${old.oldLazy} + ${val} = ${d.lazy[i]}`,
      'lazy[i] += val',
      'The node aggregate is updated. Its descendants may still hold deferred values.',
      !d.transfer,
    );
    leave();
  }
  function push(i: number, l: number, r: number) {
    enter('push', i, l, r, d.lazy[i]);
    e(
      'push-check',
      `lazy[${i}] = ${d.lazy[i]} · ${l === r ? 'leaf' : 'internal node'}`,
      'if lazy[i] == 0 or l == r:',
      'A zero tag or a leaf returns without changing descendants.',
    );
    if (d.lazy[i] === 0 || l === r) {
      e(
        'push-noop',
        'No child propagation needed',
        'return',
        'Resume the caller; no values changed.',
        false,
        'Range update',
        0,
      );
      leave();
      return;
    }
    const mid = (l + r) >> 1;
    e(
      'push-midpoint',
      `mid = ${mid}`,
      'mid = (l + r) // 2',
      'Split this interval for propagation.',
      false,
      'Range update',
      0,
    );
    const val = d.lazy[i];
    d.transfer = { parent: i, child: null, val };
    e(
      'push',
      `Push tag +${val} from node ${i}`,
      'apply(2 * i + 1, l, mid, lazy[i])',
      'Transfer is in progress. The parent keeps its tag until BOTH children are updated.',
      true,
    );
    d.transfer.child = 2 * i + 1;
    e(
      'push-left',
      `Left child ${2 * i + 1} receives +${val}`,
      'apply(2 * i + 1, l, mid, lazy[i])',
      'Left child is updated first.',
    );
    apply(2 * i + 1, l, mid, val);
    d.transfer.child = 2 * i + 2;
    e(
      'push-right',
      `Right child ${2 * i + 2} receives +${val}`,
      'apply(2 * i + 2, mid + 1, r, lazy[i])',
      'Then update the right child with the same tag.',
    );
    apply(2 * i + 2, mid + 1, r, val);
    d.lazy[i] = 0;
    d.transfer.child = null;
    e(
      'push-complete',
      `lazy[${i}] = 0 · transfer complete`,
      'lazy[i] = 0',
      'Both children now include the tag. Clear it at the parent.',
      true,
    );
    d.transfer = null;
    leave();
  }
  function update(s: number, end: number, i: number, l: number, r: number, val: number) {
    enter('update', i, l, r, val);
    d.coverage = r < s || l > end ? 'none' : s <= l && r <= end ? 'full' : 'partial';
    e(
      'overlap-check',
      `[${l}, ${r}] ∩ [${s}, ${end}] · ${d.coverage}`,
      'if r < s or l > e:',
      'Inspect this interval before changing it.',
    );
    if (d.coverage === 'none') {
      e(
        'no-overlap',
        `Skip node ${i} · no overlap`,
        'return',
        'This branch changes nothing.',
        false,
        'Range update',
        1,
      );
      leave();
      return;
    }
    e(
      'coverage-check',
      `${d.coverage === 'full' ? 'Whole' : 'Part of'} node ${i} is covered`,
      'if s <= l and r <= e:',
      'Full coverage applies once; partial coverage descends.',
    );
    if (d.coverage === 'full') {
      e(
        'full-cover',
        `Apply +${val} to [${l}, ${r}]`,
        'apply(i, l, r, val)',
        'A fully covered interval does not visit its children.',
      );
      apply(i, l, r, val);
      d.coverage = 'full';
      e(
        'covered-return',
        `Node ${i} complete`,
        'return',
        'Return after the aggregate update.',
        false,
        'Range update',
        2,
      );
      leave();
      return;
    }
    e(
      'partial-cover',
      `Descend inside [${l}, ${r}]`,
      'push(i, l, r)',
      'Push any deferred tag before visiting children.',
    );
    push(i, l, r);
    const mid = (l + r) >> 1;
    e(
      'update-midpoint',
      `mid = ${mid}`,
      'mid = (l + r) // 2',
      'The source visits the left branch before the right.',
      false,
      'Range update',
      1,
    );
    e(
      'update-left',
      `Visit left child ${2 * i + 1}`,
      'update(s, e, 2 * i + 1, l, mid, val)',
      'Pass the unchanged update interval to the left child.',
    );
    update(s, end, 2 * i + 1, l, mid, val);
    d.coverage = 'partial';
    e(
      'update-right',
      `Visit right child ${2 * i + 2}`,
      'update(s, e, 2 * i + 2, mid + 1, r, val)',
      'Also visit the right child, even if its overlap check will reject it.',
    );
    update(s, end, 2 * i + 2, mid + 1, r, val);
    d.coverage = 'partial';
    d.sum[i] = (d.sum[2 * i + 1] + d.sum[2 * i + 2]) % MOD;
    e(
      'pull-sum',
      `S[${i}] = ${d.sum[2 * i + 1]} + ${d.sum[2 * i + 2]} = ${d.sum[i]}`,
      'sum_tree[i] = (',
      'The parent pull is in progress; its squared sum is updated next.',
    );
    d.square[i] = (d.square[2 * i + 1] + d.square[2 * i + 2]) % MOD;
    e(
      'pull-complete',
      `Q[${i}] = ${d.square[2 * i + 1]} + ${d.square[2 * i + 2]} = ${d.square[i]}`,
      'sq_tree[i] = (',
      'Both parent aggregates now match the completed children.',
      true,
    );
    leave();
  }
  for (let right = 0; right < n; right++) {
    d.right = right;
    d.num = null;
    d.prev = null;
    d.range = null;
    d.operation = null;
    d.coverage = null;
    e(
      'right',
      `Read endpoint right = ${right}`,
      'for right in range(n):',
      'Extend all subarrays ending at this new index.',
      true,
      'Scan',
    );
    d.num = d.nums[right];
    e(
      'read-number',
      `num = nums[${right}] = ${d.num}`,
      'num = nums[right]',
      'Look up the previous occurrence of this value.',
      false,
      'Scan',
    );
    d.prev = d.last[String(d.num)] ?? -1;
    d.range = [d.prev + 1, right];
    d.preview = d.committed.map(
      (count, left) => count + (left >= d.prev! + 1 && left <= right ? 1 : 0),
    );
    e(
      'previous',
      `prev = ${d.prev} → increment starts [${d.prev + 1}, ${right}]`,
      'prev = last.get(num, -1)',
      'Only starts after the previous occurrence gain a new distinct value. The preview is a derived annotation.',
      true,
      'Scan',
    );
    d.updating = true;
    e(
      'update-start',
      `Range add +1 on [${d.prev + 1}, ${right}]`,
      'update(prev + 1, right, 0, 0, n - 1, 1)',
      'Committed counts stay visible while the real tree processes this update.',
      true,
    );
    update(d.prev + 1, right, 0, 0, n - 1, 1);
    d.updating = false;
    d.committed = [...d.preview];
    d.committedRight = right;
    d.preview = null;
    d.active = null;
    d.coverage = null;
    e(
      'update-complete',
      `Counts sealed for right = ${right}`,
      'update(prev + 1, right, 0, 0, n - 1, 1)',
      'The update returned. The root squared sum is the contribution for this endpoint.',
      true,
    );
    d.last[String(d.num)] = right;
    e(
      'last-write',
      `last[${d.num}] = ${right}`,
      'last[num] = right',
      'Record this occurrence only after the update.',
      false,
      'Accumulate',
    );
    d.res += d.square[0];
    e(
      'add-contribution',
      `res + Q[root] = ${d.res}`,
      'res += sq_tree[0]',
      'Add this endpoint contribution exactly once.',
      false,
      'Accumulate',
    );
    d.res %= MOD;
    d.contributions.push({ right, value: d.square[0], total: d.res });
    e(
      'contribution',
      `Endpoint ${right}: +${d.square[0]} → ${d.res}`,
      'res %= MOD',
      'The accumulated answer now includes this endpoint.',
      true,
      'Accumulate',
    );
  }
  d.result = d.res;
  e(
    'result',
    `Returned answer: ${d.result}`,
    'return res',
    'All non-empty subarrays have contributed once, grouped by right endpoint.',
    true,
    'Complete',
  );
}
export function createFrames(input: unknown, _problem?: Problem, limit = 12000) {
  const { nums } = parseInput(JSON.stringify(input));
  return completeTrace(
    referenceCode,
    'distinct-squares-segment-tree',
    () => initial(nums),
    simulate,
    limit,
  );
}
