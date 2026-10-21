import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from './load-module.mjs';
const trace = await load('lessons/add-two-integers/trace.ts');
const { visualizer } = await load('lessons/add-two-integers/adapter.ts');
const { Canvas } = await load('lessons/add-two-integers/Canvas.tsx');
const { InputEditor } = await load('lessons/add-two-integers/InputEditor.tsx');
const { getLesson } = await load('registry.tsx');
const { nextJump } = await load('core/lesson.tsx');
const problem = {
  source: 'leetcode',
  source_key: '2235',
  title: 'Fixture',
  notes: {},
  taxonomy: [],
  primary_subtag: { slug: 'bit-manipulation' },
  primary_main: { slug: 'math' },
};
const digit = (number, i) => {
  const divisor = 2 ** i;
  return ((Math.floor(number / divisor) % 2) + 2) % 2;
};
test('Full adder agrees with independent arithmetic, across signed small pairs and all presets', () => {
  const expected = [17, -6, 0, -7, 8, 0, -12, 0, 200, -200, 6];
  for (let i = 0; i < visualizer.presets.length; i++) {
    const input = trace.parseInput(visualizer.presets[i].input),
      before = JSON.stringify(input),
      frames = trace.createFrames(input),
      d = frames.at(-1).data;
    assert.equal(d.result, expected[i]);
    assert.equal(d.result, input.num1 + input.num2);
    assert.equal(d.written, 32);
    assert.equal(JSON.stringify(input), before);
    assert.equal(d.res, (input.num1 + input.num2 + 2 ** 32) % 2 ** 32);
  }
  for (let a = -8; a <= 8; a++)
    for (let b = -8; b <= 8; b++)
      assert.equal(trace.createFrames({ num1: a, num2: b }).at(-1).data.result, a + b);
  let seed = 2235;
  for (let n = 0; n < 100; n++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const a = (seed % 201) - 100;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const b = (seed % 201) - 100;
    assert.equal(trace.createFrames({ num1: a, num2: b }).at(-1).data.result, a + b);
  }
});
test('Each source assignment keeps old carry, outgoing carry and OR-write timing distinct', () => {
  const seen = new Set();
  for (const [num1, num2] of [
    [7, 1],
    [-1, 1],
    [-5, -7],
    [12, 5],
    [100, 100],
  ]) {
    const frames = trace.createFrames({ num1, num2 });
    assert.deepEqual(
      frames.filter((f) => f.data.action === 'column').map((f) => f.data.i),
      Array.from({ length: 32 }, (_, i) => i),
    );
    for (let n = 1; n < frames.length; n++) {
      const d = frames[n].data,
        old = frames[n - 1].data,
        c = d.column;
      if (d.action === 'column') {
        assert.equal(c.a, null);
        assert.equal(c.b, null);
        assert.equal(c.sumBit, null);
        assert.equal(c.carryOut, null);
        assert.equal(d.a, old.a);
        assert.equal(d.sumBit, old.sumBit);
      }
      if (d.action === 'read-a') assert.equal(d.a, digit(num1, d.i));
      if (d.action === 'read-b') assert.equal(d.b, digit(num2, d.i));
      if (d.action === 'sum-bit') {
        assert.equal(d.sumBit, (c.a + c.b + c.carryIn) % 2);
        assert.equal(d.carry, old.carry);
        assert.equal(c.carryOut, null);
        seen.add([c.a, c.b, c.carryIn].join(''));
      }
      if (d.action === 'carry-out') {
        assert.equal(d.carry, Math.floor((c.a + c.b + c.carryIn) / 2));
        assert.equal(d.sumBit, old.sumBit);
        assert.equal(d.res, old.res);
        assert.equal(c.carryIn, old.column.carryIn);
      }
      if (d.action === 'write-bit') {
        assert.equal(d.res, old.res + d.sumBit * 2 ** d.i);
        assert.equal(d.written, old.written + 1);
        assert.ok(d.res >= 0 && d.res <= 2 ** 32 - 1);
        assert.equal(d.res % 2 ** d.i, c.oldRes);
      }
    }
  }
  // A separate sweep demonstrates every full-adder truth-table row, including 000/111.
  for (let a = 0; a < 4; a++)
    for (let b = 0; b < 4; b++)
      for (const f of trace.createFrames({ num1: a, num2: b }))
        if (f.data.action === 'sum-bit') {
          const c = f.data.column;
          seen.add([c.a, c.b, c.carryIn].join(''));
        }
  assert.equal(seen.size, 8);
});
test('Sign extension, unsigned result and Python NOT conversion preserve negative semantics', () => {
  const frames = trace.createFrames({ num1: -10, num2: 4 }),
    last = frames.at(-1).data;
  assert.equal(last.res, 4294967290);
  assert.equal(last.complement, 5);
  assert.equal(last.result, -6);
  assert.equal(last.result, -last.complement - 1);
  assert.equal(last.result, last.res - 2 ** 32);
  for (const f of frames.filter((f) => f.data.action === 'read-a' && f.data.i >= 4))
    assert.equal(f.data.a, 1);
  for (const f of frames.slice(0, -2)) {
    assert.equal(f.data.signSet, null);
    assert.equal(f.data.result, null);
    assert.equal(f.data.complement, null);
  }
  const cancelled = trace.createFrames({ num1: -1, num2: 1 }).at(-1).data;
  assert.equal(cancelled.carry, 1);
  assert.equal(cancelled.res, 0);
  assert.equal(cancelled.signSet, false);
  assert.equal(cancelled.result, 0);
  assert.equal(
    trace.createFrames({ num1: 0, num2: 0 }).filter((f) => f.data.action === 'write-bit').length,
    32,
  );
});
test('Source focus, independent nested snapshots and count-before-allocation limit are valid', () => {
  const lines = trace.referenceCode.split('\n');
  for (const preset of visualizer.presets) {
    const frames = trace.createFrames(trace.parseInput(preset.input));
    for (const f of frames) {
      assert.equal(f.kind, 'add-two-integers');
      assert.equal(f.codeLines.length, 1);
      assert.equal(lines[f.codeLines[0] - 1].trim(), f.codeFocus[0].trim());
    }
    const i = frames.findIndex((f) => f.data.action === 'sum-bit'),
      saved = JSON.stringify(frames.slice(i + 1));
    frames[i].data.column.carryIn = 99;
    frames[i].data.res = -999;
    assert.equal(JSON.stringify(frames.slice(i + 1)), saved);
  }
  let clones = 0;
  const clone = globalThis.structuredClone;
  globalThis.structuredClone = (v) => {
    clones++;
    return clone(v);
  };
  try {
    assert.throws(() => trace.createFrames({ num1: 1, num2: 2 }, problem, 10), /Trace too large/);
    assert.equal(clones, 0);
  } finally {
    globalThis.structuredClone = clone;
  }
});
test('Official signed input parser rejects coercions, missing values and out-of-domain integers', () => {
  assert.deepEqual(trace.parseInput('{"num1":-100,"num2":100}'), { num1: -100, num2: 100 });
  for (const raw of [
    '{',
    'null',
    '[]',
    '[1,2]',
    '{}',
    '{"num1":0}',
    '{"num1":"1","num2":2}',
    '{"num1":true,"num2":0}',
    '{"num1":1.5,"num2":2}',
    '{"num1":101,"num2":0}',
    '{"num1":-101,"num2":0}',
    '{"num1":null,"num2":0}',
    '{"num1":NaN,"num2":0}',
  ])
    assert.throws(() => trace.parseInput(raw), raw);
  const editor = renderToStaticMarkup(
    createElement(InputEditor, { raw: '{"num1":-10,"num2":4}', onChange: () => {} }),
  );
  assert.ok(editor.includes('Fields'));
  assert.ok(editor.includes('JSON'));
  assert.ok(editor.includes('value="-10"'));
  assert.ok(!editor.includes('type="number"'));
});
test('Scoped registry, jumps, full-adder and word/signed diagrams render semantic states', () => {
  for (const source_key of ['2235', 'add-two-integers'])
    assert.equal(getLesson({ ...problem, source_key }).adapter.id, visualizer.id);
  assert.equal(getLesson({ ...problem, source: 'atcoder' }).adapter.mode, 'generic');
  const frames = trace.createFrames({ num1: -10, num2: 4 });
  assert.equal(frames[nextJump(frames, 0, { action: 'column' })].data.action, 'column');
  assert.equal(frames[nextJump(frames, 0, { action: 'sign-check' })].data.action, 'sign-check');
  const html = renderToStaticMarkup(
    createElement(Canvas, { data: frames.find((f) => f.data.action === 'sum-bit').data }),
  );
  for (const text of [
    'Full-adder current column',
    'Carry in · captured',
    'Carry out · next column',
    'Scrollable 32-bit addition board',
    'Inspect bit 31',
    'Unsigned working res',
    'initialized, not finalized',
    'Signed result interpretation',
  ])
    assert.ok(html.includes(text), text);
  const final = renderToStaticMarkup(createElement(Canvas, { data: frames.at(-1).data }));
  assert.ok(final.includes('Returned sum: -6'));
  assert.ok(final.includes('4294967290'));
  assert.ok(final.includes('Mask-XOR subexpression'));
  assert.ok(final.includes('addition-committed'));
});
