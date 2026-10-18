import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from './load-module.mjs';
const squares = await load('lessons/distinct-squares-segment-tree/trace.ts');
const or = await load('lessons/maximum-or-subsets/trace.ts');
const { visualizer: squaresAdapter } = await load(
  'lessons/distinct-squares-segment-tree/adapter.ts',
);
const { visualizer: orAdapter } = await load('lessons/maximum-or-subsets/adapter.ts');
const { Canvas: SquaresCanvas } = await load('lessons/distinct-squares-segment-tree/Canvas.tsx');
const { Canvas: OrCanvas } = await load('lessons/maximum-or-subsets/Canvas.tsx');
const { getLesson } = await load('registry.tsx');
const { selectFrames, nextJump } = await load('core/lesson.tsx');
const { completeTrace } = await load('core/complete-trace.ts');
const problem = {
  source: 'leetcode',
  source_key: '',
  notes: {},
  title: 'Fixture',
  primary_subtag: { slug: 'arrays' },
  primary_main: { slug: 'arrays-strings' },
  taxonomy: [],
};

function distinctOracle(nums) {
  const byRight = nums.map(() => 0);
  for (let l = 0; l < nums.length; l++) {
    const seen = new Set();
    for (let r = l; r < nums.length; r++) {
      seen.add(nums[r]);
      byRight[r] += seen.size ** 2;
    }
  }
  return { result: byRight.reduce((a, b) => a + b, 0), byRight };
}
function subsetOracle(nums, from = 0, initial = 0, target = nums.reduce((a, b) => a | b, 0)) {
  let count = 0;
  for (let mask = 0; mask < 2 ** (nums.length - from); mask++) {
    let value = initial;
    for (let i = from; i < nums.length; i++) if (mask & (1 << (i - from))) value |= nums[i];
    if (value === target) count++;
  }
  return count;
}
function arrays(n, alphabet = [1, 2, 3]) {
  return n ? arrays(n - 1, alphabet).flatMap((a) => alphabet.map((v) => [...a, v])) : [[]];
}
test('2916 endpoint contributions match independent distinct-set enumeration', () => {
  const inputs = squaresAdapter.presets.map((p) => squares.parseInput(p.input).nums);
  for (let n = 1; n <= 4; n++) inputs.push(...arrays(n));
  inputs.push(
    Array.from({ length: 12 }, (_, i) => i + 1),
    Array(12).fill(100000),
  );
  for (const nums of inputs) {
    const frames = squares.createFrames({ nums });
    const expected = distinctOracle(nums),
      result = frames.at(-1).data;
    assert.equal(result.result, expected.result, String(nums));
    assert.deepEqual(
      result.contributions.map((e) => e.value),
      expected.byRight,
    );
    for (const frame of frames) {
      const d = frame.data;
      if (d.action === 'previous') {
        assert.equal(d.prev, nums.slice(0, d.right).lastIndexOf(nums[d.right]));
        assert.deepEqual(d.range, [d.prev + 1, d.right]);
      }
      if (d.updating) assert.equal(d.committedRight, d.right - 1);
      if (d.action === 'update-complete') {
        const counts = nums.map((_, l) =>
          l > d.right ? 0 : new Set(nums.slice(l, d.right + 1)).size,
        );
        assert.deepEqual(d.committed, counts);
        assert.equal(
          d.square[0],
          counts.reduce((sum, v) => sum + v * v, 0),
        );
        assert.equal(
          d.sum[0],
          counts.reduce((sum, v) => sum + v, 0),
        );
      }
    }
  }
});
test('2916 uses old S, preserves deferred descendants and transfers accumulated tags in order', () => {
  const frames = squares.createFrames({ nums: [1, 2, 3, 4, 1, 2] });
  assert.ok(frames.some((f) => f.data.transfer?.val > 1));
  assert.ok(frames.some((f) => f.data.action === 'no-overlap'));
  let deferredMismatch = false;
  for (let i = 0; i < frames.length; i++) {
    const d = frames[i].data,
      op = d.operation;
    if (d.action === 'apply-square') {
      assert.equal(d.sum[op.i], op.oldSum);
      assert.equal(d.square[op.i], op.oldSquare + 2 * op.val * op.oldSum + op.length * op.val ** 2);
    }
    if (d.action === 'apply-complete') {
      const expected = squares.squareIncrement(op.oldSum, op.oldSquare, op.length, op.val);
      assert.equal(d.sum[op.i], expected.sum);
      assert.equal(d.square[op.i], expected.square);
      assert.equal(d.lazy[op.i], op.oldLazy + op.val);
      if (op.l !== op.r && d.sum[op.i] !== d.sum[2 * op.i + 1] + d.sum[2 * op.i + 2])
        deferredMismatch = true;
    }
    if (d.action === 'push') {
      const end = frames.findIndex((f, j) => j > i && f.data.action === 'push-complete');
      const transfer = frames.slice(i + 1, end + 1);
      assert.deepEqual(
        transfer
          .filter((f) => ['push-left', 'push-right'].includes(f.data.action))
          .map((f) => f.data.transfer.child),
        [2 * d.transfer.parent + 1, 2 * d.transfer.parent + 2],
      );
      assert.equal(frames[end].data.lazy[d.transfer.parent], 0);
      assert.ok(
        transfer.slice(0, -1).every((f) => f.data.lazy[d.transfer.parent] === d.transfer.val),
      );
    }
    if (d.action === 'pull-complete') {
      const node = d.active;
      assert.equal(d.sum[node], (d.sum[2 * node + 1] + d.sum[2 * node + 2]) % squares.MOD);
      assert.equal(d.square[node], (d.square[2 * node + 1] + d.square[2 * node + 2]) % squares.MOD);
    }
  }
  assert.ok(deferredMismatch, 'Never eagerly rewrite children');
  const oldS = squares.MOD - 2,
    oldQ = squares.MOD - 3,
    length = 7,
    val = 3;
  const expectedQ = Number(
    (BigInt(oldQ) + 2n * BigInt(val) * BigInt(oldS) + BigInt(length * val * val)) %
      BigInt(squares.MOD),
  );
  assert.equal(squares.squareIncrement(oldS, oldQ, length, val).square, expectedQ);
});
test('2044 matches exhaustive index-subset enumeration and independently checked suffix counts', () => {
  const inputs = orAdapter.presets.map((p) => or.parseInput(p.input).nums);
  for (let n = 1; n <= 5; n++) inputs.push(...arrays(n));
  inputs.push([1, 2, 4, 8, 16, 32, 64, 100000]);
  for (const nums of inputs) {
    const frames = or.createFrames({ nums }),
      final = frames.at(-1).data;
    assert.equal(final.result, subsetOracle(nums), String(nums));
    assert.ok(final.result <= 2 ** nums.length - 1);
    for (const entry of final.memo) {
      assert.ok(entry.pos < nums.length, 'Terminal returns are not cached');
      assert.equal(entry.count, subsetOracle(nums, entry.pos, entry.or, final.maxOr));
    }
    for (const f of frames.filter((f) => f.data.action === 'memo-store')) {
      const call = f.data.calls.at(-1);
      assert.notEqual(call.take, null);
      assert.notEqual(call.skip, null);
      assert.equal(f.data.memo.at(-1).count, call.take + call.skip);
    }
  }
});
test('2044 preserves source branch order, tuple cache semantics, positive domain and terminal returns', () => {
  const frames = or.createFrames({ nums: [2, 2, 2] });
  assert.ok(frames.some((f) => f.data.action === 'memo-hit'));
  assert.equal(frames.at(-1).data.result, 7);
  for (let i = 0; i < frames.length; i++) {
    const d = frames[i].data,
      call = d.calls.at(-1);
    if (d.action === 'take') {
      const next = frames[i + 1].data.calls.at(-1);
      assert.equal(next.via, 'take');
      assert.equal(next.pos, call.pos + 1);
      assert.equal(next.or, call.or | d.nums[call.pos]);
      assert.deepEqual(next.chosen, [...call.chosen, call.pos]);
    }
    if (d.action === 'skip') {
      assert.notEqual(call.take, null);
      const next = frames[i + 1].data.calls.at(-1);
      assert.equal(next.via, 'skip');
      assert.equal(next.pos, call.pos + 1);
      assert.equal(next.or, call.or);
      assert.deepEqual(next.chosen, call.chosen);
    }
    if (d.action === 'base-check') assert.equal(frames[i - 1].data.action, 'memo-check');
    if (d.action === 'memo-hit') assert.equal(frames[i - 1].data.action, 'memo-check');
    if (call) assert.equal(new Set(call.chosen).size, call.chosen.length);
    assert.ok(d.memo.every((m) => m.pos < d.nums.length));
  }
  const zeros = or.createFrames({ nums: [3, 1] }).at(-1).data.memo;
  assert.ok(zeros.some((entry) => entry.count === 0));
  assert.ok(
    frames.some((f) => f.data.action === 'take' && f.data.calls.at(-1).or === f.data.maxOr),
    'No early target shortcut',
  );
});
test('Both studios have independent snapshots and valid exact canonical source focus', () => {
  for (const adapter of [squaresAdapter, orAdapter])
    for (const preset of adapter.presets) {
      const frames = adapter.createFrames(adapter.parseInput(preset.input), problem);
      for (const f of frames) {
        assert.ok(f.codeLines.length > 0);
        assert.equal(
          adapter.referenceCode.split('\n')[f.codeLines[0] - 1].trim(),
          f.codeFocus[0].trim(),
        );
      }
      const baseline = JSON.stringify(frames.slice(1));
      frames[0].data.nums[0] = -999;
      frames[0].data.calls.push({ tampered: true });
      if (frames[0].data.memo) frames[0].data.memo.push({ tampered: true });
      else {
        frames[0].data.sum.push(-1);
        frames[0].data.nodes[0].l = -100;
      }
      assert.equal(JSON.stringify(frames.slice(1)), baseline);
    }
});
test('Strict array parsers and count-before-snapshot limit reject without truncated success', () => {
  for (const [adapter, maximum] of [
    [squaresAdapter, 12],
    [orAdapter, 8],
  ]) {
    assert.deepEqual(adapter.parseInput('[1,2,1]'), { nums: [1, 2, 1] });
    for (const raw of [
      '{',
      '{}',
      'null',
      '[]',
      '{"nums":1}',
      '{"nums":[0]}',
      '{"nums":[-1]}',
      '{"nums":[1.2]}',
      '{"nums":["2"]}',
      '{"nums":[true]}',
      '{"nums":[100001]}',
      JSON.stringify({ nums: Array(maximum + 1).fill(1) }),
    ])
      assert.throws(() => adapter.parseInput(raw), raw);
  }
  let clones = 0;
  const clone = globalThis.structuredClone;
  globalThis.structuredClone = (value) => {
    clones++;
    return clone(value);
  };
  try {
    assert.throws(
      () =>
        completeTrace(
          'step',
          'test',
          () => ({ action: '', equation: '' }),
          (_, emit) => {
            for (let i = 0; i < 3; i++) emit('step', 'step', 'step', 'test');
          },
          2,
        ),
      /Trace too large/,
    );
    assert.equal(clones, 0);
  } finally {
    globalThis.structuredClone = clone;
  }
  assert.throws(() => squares.createFrames({ nums: [1, 2, 1] }, problem, 5), /Trace too large/);
  assert.throws(() => or.createFrames({ nums: [3, 1] }, problem, 5), /Trace too large/);
});
test('Registry, guided filtering, jumps, generic interaction callback and semantic diagrams', () => {
  for (const [adapter, keys] of [
    [squaresAdapter, ['2916', 'subarrays-distinct-element-sum-of-squares-ii']],
    [orAdapter, ['2044', 'count-number-of-maximum-bitwise-or-subsets']],
  ]) {
    for (const source_key of keys)
      assert.equal(getLesson({ ...problem, source_key }).adapter.id, adapter.id);
    assert.equal(
      getLesson({ ...problem, source: 'lintcode', source_key: keys[0] }).adapter.mode,
      'generic',
    );
  }
  const frames = squares.createFrames({ nums: [1, 2, 1] });
  const lesson = getLesson({ ...problem, source_key: '2916' });
  const guided = selectFrames(frames, lesson.playback, '', false);
  assert.ok(guided.length < frames.length);
  assert.deepEqual(selectFrames(frames, lesson.playback, '', true), frames);
  assert.equal(guided.at(-1).data.result, 15);
  assert.ok(nextJump(guided, 0, { action: 'right' }) > 0);
  const treeHtml = renderToStaticMarkup(createElement(SquaresCanvas, { data: frames.at(-1).data }));
  for (const label of [
    'Subarray Counts',
    'Lazy Tree State',
    'Stored lazy segment tree',
    'Square update uses old S',
    'Returned answer: 15',
  ])
    assert.ok(treeHtml.includes(label), label);
  const orFrames = or.createFrames({ nums: [2, 2, 2] });
  const orHtml = renderToStaticMarkup(
    createElement(OrCanvas, { data: orFrames.find((f) => f.data.action === 'memo-hit').data }),
  );
  for (const label of [
    'Bit union',
    'Tuple memoization table',
    'Active call ancestry',
    'Reuse',
    'Current OR',
  ])
    assert.ok(orHtml.includes(label), label);
  const zeroReturn = or
    .createFrames({ nums: [3, 1] })
    .find((f) => f.data.action === 'take-return' && f.data.calls.at(-1)?.take === 0);
  assert.ok(zeroReturn, 'A returned zero is a completed result, not a pending branch');
  const branches = renderToStaticMarkup(createElement(OrCanvas, { data: zeroReturn.data }));
  assert.ok(branches.includes('class="branch-returned">0 continuations'));
  assert.ok(branches.includes('class="branch-pending">Pending'));
  const pending = renderToStaticMarkup(
    createElement(SquaresCanvas, {
      data: frames.find((f) => f.data.action === 'update-start').data,
    }),
  );
  assert.ok(pending.includes('not committed'));
});
