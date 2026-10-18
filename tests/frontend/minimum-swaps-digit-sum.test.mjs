import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from './load-module.mjs';
const trace = await load('lessons/minimum-swaps-digit-sum/trace.ts');
const { visualizer } = await load('lessons/minimum-swaps-digit-sum/adapter.ts');
const { Canvas } = await load('lessons/minimum-swaps-digit-sum/Canvas.tsx');
const { permutationCycles } = await load('lessons/minimum-swaps-digit-sum/annotations.ts');
const { InputEditor } = await load('lessons/minimum-swaps-digit-sum/InputEditor.tsx');
const { NumberArrayInputEditor } = await load('components/NumberArrayInputEditor.tsx');
const { numericArray } = await load('core/complete-trace.ts');
const { getLesson, nextJump } = await load('core/lesson.tsx').then(async (core) => ({
  ...core,
  ...(await load('registry.tsx')),
}));
const problem = {
  source: 'leetcode',
  source_key: '',
  notes: {},
  title: 'Fixture',
  primary_subtag: { slug: 'sorting' },
  primary_main: { slug: 'search-ordering' },
  taxonomy: [],
};
const sum = (value) => [...String(value)].reduce((s, digit) => s + Number(digit), 0);
const target = (nums) => [...nums].sort((a, b) => sum(a) - sum(b) || a - b);
function distances(values) {
  const goal = target(values);
  const queue = [goal],
    costs = new Map([[goal.join(','), 0]]);
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head],
      cost = costs.get(current.join(','));
    for (let i = 0; i < current.length; i++)
      for (let j = i + 1; j < current.length; j++) {
        const next = [...current];
        [next[i], next[j]] = [next[j], next[i]];
        const key = next.join(',');
        if (!costs.has(key)) {
          costs.set(key, cost + 1);
          queue.push(next);
        }
      }
  }
  return { queue, costs };
}
test('Digit-sum swaps match independent BFS minimum-swap and string-key oracles', () => {
  const expectedPresets = [2, 1, 0, 0, 2, 2, 3, 2, 1, 1];
  for (let i = 0; i < visualizer.presets.length; i++) {
    const input = trace.parseInput(visualizer.presets[i].input);
    const before = JSON.stringify(input);
    const frames = trace.createFrames(input),
      final = frames.at(-1).data;
    assert.equal(final.result, expectedPresets[i]);
    assert.equal(final.result, distances(input.nums).costs.get(input.nums.join(',')));
    assert.deepEqual(final.nums, target(input.nums));
    assert.deepEqual(final.keys, input.nums.map(sum));
    assert.equal(JSON.stringify(input), before);
  }
  for (const values of [[1], [37, 100], [31, 13, 22], [18, 43, 34, 16], [1, 1000, 13, 22, 2]]) {
    const { queue, costs } = distances(values);
    for (const nums of queue) {
      const final = trace.createFrames({ nums }).at(-1).data;
      assert.equal(final.result, costs.get(nums.join(',')), String(nums));
      assert.deepEqual(final.nums, target(nums));
      assert.equal(
        permutationCycles(nums, target(nums)).reduce((s, c) => s + c.length - 1, 0),
        final.result,
      );
    }
  }
  const large = Array.from({ length: 12 }, (_, i) => 1000000000 - i * 29);
  const final = trace.createFrames({ nums: large }).at(-1).data;
  assert.deepEqual(final.nums, target(large));
  assert.ok(final.result <= 11);
});
test('Digit helper extracts right to left, visits zero digits and does not precompute keys', () => {
  const nums = [1000000000, 31, 13];
  const frames = trace.createFrames({ nums });
  assert.deepEqual(frames[0].data.keys, [null, null, null]);
  assert.equal(frames[0].data.target, null);
  assert.deepEqual(
    frames.filter((f) => f.data.action === 'helper-enter').map((f) => f.data.helper.value),
    nums,
  );
  const digits = frames
    .filter((f) => f.data.action === 'digit-add' && f.data.helper.value === 1000000000)
    .map((f) => f.data.helper.digit);
  assert.deepEqual(digits, [0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
  for (const frame of frames) {
    const d = frame.data,
      h = d.helper;
    if (d.action === 'digit-add') {
      assert.equal(h.digit, h.oldRemaining % 10);
      assert.equal(h.total, h.oldTotal + h.digit);
      assert.equal(h.remaining, h.oldRemaining);
    }
    if (d.action === 'digit-shift') assert.equal(h.remaining, Math.floor(h.oldRemaining / 10));
    if (d.action === 'key-return') assert.equal(d.keys[h.inputIndex], sum(h.value));
    if (d.target !== null) assert.ok(d.keys.every((k) => k !== null));
  }
});
test('Map preparation, atomic swap, count update and confirmed-prefix timing follow source', () => {
  const frames = trace.createFrames({ nums: [18, 43, 34, 16] });
  assert.deepEqual(
    frames
      .filter((f) => f.data.action === 'map-store')
      .map((f) => [f.data.nums[f.data.i], f.data.i]),
    [
      [18, 0],
      [43, 1],
      [34, 2],
      [16, 3],
    ],
  );
  for (let n = 1; n < frames.length; n++) {
    const d = frames[n].data,
      old = frames[n - 1].data;
    if (d.target) assert.deepEqual(d.nums.slice(0, d.confirmed), d.target.slice(0, d.confirmed));
    if (d.action === 'lookup') {
      assert.equal(d.j, d.pos[d.target[d.i]]);
      assert.ok(d.j > d.i);
    }
    if (d.action === 'map-first' || d.action === 'map-second') {
      assert.deepEqual(d.nums, old.nums);
      assert.equal(d.count, old.count);
      assert.ok(Object.entries(d.pos).some(([value, index]) => d.nums[index] !== Number(value)));
      assert.equal(d.swap.writes.length, d.action === 'map-first' ? 1 : 2);
    }
    if (d.action === 'swap') {
      assert.equal(old.action, 'map-second');
      assert.equal(d.nums[d.swap.i], old.nums[d.swap.j]);
      assert.equal(d.nums[d.swap.j], old.nums[d.swap.i]);
      assert.equal(d.count, old.count);
      assert.equal(d.history.length, d.count + 1);
      assert.equal(d.confirmed, old.confirmed);
      assert.equal(frames[n + 1].data.action, 'confirmed');
      assert.equal(frames[n + 1].data.count, d.count + 1);
    }
    if (d.count !== null && !['prepared-one', 'prepared-both'].includes(d.swap?.stage)) {
      for (const [value, index] of Object.entries(d.pos))
        assert.equal(d.nums[index], Number(value));
    }
  }
  const sorted = trace.createFrames({ nums: [22, 14, 33, 7] });
  assert.equal(sorted.filter((f) => f.data.action === 'swap').length, 0);
  assert.equal(sorted.at(-1).data.count, 0);
  assert.equal(sorted.at(-1).data.confirmed, 4);
});
test('Frames are independent and exact source focus distinguishes both array loops', () => {
  for (const preset of visualizer.presets) {
    const frames = trace.createFrames(trace.parseInput(preset.input));
    const lines = trace.referenceCode.split('\n');
    for (const f of frames) {
      assert.equal(f.kind, 'minimum-swaps-digit-sum');
      assert.equal(f.codeLines.length, 1);
      assert.equal(lines[f.codeLines[0] - 1].trim(), f.codeFocus[0].trim());
    }
    const mapLoop = frames.find((f) => f.data.action === 'map-index').codeLines[0];
    const swapLoop = frames.find((f) => f.data.action === 'position').codeLines[0];
    assert.ok(mapLoop < swapLoop);
    const baseline = JSON.stringify(frames.slice(1));
    frames[0].data.original[0] = -1;
    frames[0].data.nums[0] = -2;
    frames[0].data.keys[0] = -3;
    frames[0].data.history.push({ tampered: true });
    assert.equal(JSON.stringify(frames.slice(1)), baseline);
    const prepared = frames.findIndex((f) => f.data.action === 'map-first');
    if (prepared >= 0) {
      const later = JSON.stringify(frames.slice(prepared + 1));
      frames[prepared].data.pos[123] = -1;
      frames[prepared].data.swap.writes[0].after = -999;
      assert.equal(JSON.stringify(frames.slice(prepared + 1)), later);
    }
  }
});
test('Distinct billion-bound parser/editor preserve old shared defaults and reject invalid input', () => {
  assert.deepEqual(trace.parseInput('[1000000000,1]'), { nums: [1000000000, 1] });
  assert.deepEqual(trace.parseInput('{"nums":[31,13,22]}'), { nums: [31, 13, 22] });
  for (const raw of [
    '{',
    '{}',
    'null',
    '[]',
    '[1,1]',
    '[0]',
    '[-1]',
    '[1.1]',
    '["1"]',
    '[true]',
    '[1000000001]',
    JSON.stringify(Array.from({ length: 13 }, (_, i) => i + 1)),
  ])
    assert.throws(() => trace.parseInput(raw), raw);
  assert.deepEqual(numericArray('[1,1]', 8), { nums: [1, 1] });
  assert.throws(() => numericArray('[100001]', 8));
  const editor = renderToStaticMarkup(
    createElement(InputEditor, { raw: '{"nums":[1]}', onChange: () => {} }),
  );
  assert.ok(editor.includes('distinct'));
  assert.ok(editor.includes('1,000,000,000'));
  const oldEditor = renderToStaticMarkup(
    createElement(NumberArrayInputEditor, { raw: '{"nums":[1]}', onChange: () => {}, maximum: 8 }),
  );
  assert.ok(oldEditor.includes('100,000'));
  assert.ok(!oldEditor.includes('distinct'));
  let clones = 0;
  const clone = globalThis.structuredClone;
  globalThis.structuredClone = (value) => {
    clones++;
    return clone(value);
  };
  try {
    assert.throws(
      () => trace.createFrames({ nums: [18, 43, 34, 16] }, problem, 10),
      /Trace too large/,
    );
    assert.equal(clones, 0);
  } finally {
    globalThis.structuredClone = clone;
  }
});
test('Registry, jump controls and semantic workbench expose prepared, swapped and returned states', () => {
  for (const source_key of ['3551', 'minimum-swaps-to-sort-by-digit-sum'])
    assert.equal(getLesson({ ...problem, source_key }).adapter.id, visualizer.id);
  assert.equal(
    getLesson({ ...problem, source: 'lintcode', source_key: '3551' }).adapter.mode,
    'generic',
  );
  const frames = trace.createFrames({ nums: [18, 43, 34, 16] });
  assert.equal(frames[nextJump(frames, 0, { action: 'swap' })].data.action, 'swap');
  assert.equal(frames[nextJump(frames, 0, { action: 'confirmed' })].data.action, 'confirmed');
  const render = (action) =>
    renderToStaticMarkup(
      createElement(Canvas, { data: frames.find((f) => f.data.action === action).data }),
    );
  const prepared = render('map-second');
  for (const label of [
    'Aligned working and target arrays',
    'Working nums',
    'Target sorted_nums',
    'Position updates prepared; swap pending',
    'Selected value inspector',
    'Swap history',
    'Why is this minimum?',
    'Individual map writes',
  ])
    assert.ok(prepared.includes(label), label);
  assert.ok(render('swap').includes('count update next'));
  assert.ok(render('helper-enter').includes('Active digit-sum helper'));
  assert.ok(render('return').includes('Returned minimum swaps: 2'));
});
