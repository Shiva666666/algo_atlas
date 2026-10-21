import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from './load-module.mjs';
const trace = await load('lessons/divide-two-integers/trace.ts');
const { visualizer } = await load('lessons/divide-two-integers/adapter.ts');
const { Canvas } = await load('lessons/divide-two-integers/Canvas.tsx');
const { InputEditor } = await load('lessons/divide-two-integers/InputEditor.tsx');
const { getLesson } = await load('registry.tsx');
const { nextJump } = await load('core/lesson.tsx');
const problem = {
  source: 'leetcode',
  source_key: '29',
  title: 'Fixture',
  notes: {},
  taxonomy: [],
  primary_subtag: { slug: 'bit-manipulation' },
  primary_main: { slug: 'math' },
};
const oracle = (a, b) => Math.min(2147483647, Number(BigInt(a) / BigInt(b)));
test('Loop boundaries show candidate preparation or completed checks, never repeated normalization', () => {
  for (const input of [
    { dividend: 10, divisor: 3 },
    { dividend: -7, divisor: 3 },
  ]) {
    const frames = trace.createFrames(input);
    for (const f of frames.filter(
      (f) => f.data.action === 'loop' || f.data.action === 'loop-end',
    )) {
      const html = renderToStaticMarkup(createElement(Canvas, { data: f.data }));
      assert.ok(!html.includes('Prepare the magnitudes'));
      assert.ok(!html.includes('Check the sign bits, then convert'));
      if (f.data.action === 'loop') {
        assert.ok(html.includes(`Prepare shift ${f.data.i}`));
        assert.ok(html.includes('candidate check pending'));
      } else {
        assert.ok(html.includes('All shifts complete'));
        assert.ok(html.includes('signed return pending'));
        assert.ok(html.includes('All 32 shift checks are complete'));
      }
    }
  }
});
test('Division matches independent truncated arithmetic across presets, small pairs and boundaries', () => {
  const expected = [3, -2, 0, 0, 3, 8, 31, 2147483647, -2147483648, 2147483647, 1, 0];
  for (let i = 0; i < visualizer.presets.length; i++) {
    const input = trace.parseInput(visualizer.presets[i].input),
      before = JSON.stringify(input),
      result = trace.createFrames(input).at(-1).data.result;
    assert.equal(result, expected[i]);
    assert.equal(result, oracle(input.dividend, input.divisor));
    assert.equal(JSON.stringify(input), before);
  }
  for (let a = -12; a <= 12; a++)
    for (let b = -12; b <= 12; b++)
      if (b !== 0)
        assert.equal(
          trace.createFrames({ dividend: a, divisor: b }).at(-1).data.result,
          oracle(a, b),
        );
  const bounds = [-2147483648, -2147483647, -1, 0, 1, 2147483646, 2147483647];
  for (const a of bounds)
    for (const b of bounds)
      if (b !== 0)
        assert.equal(
          trace.createFrames({ dividend: a, divisor: b }).at(-1).data.result,
          oracle(a, b),
        );
  let seed = 29;
  for (let k = 0; k < 120; k++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    const a = seed;
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    const b = seed || 1;
    assert.equal(trace.createFrames({ dividend: a, divisor: b }).at(-1).data.result, oracle(a, b));
  }
});
test('Every shift, branch and individual write follows the saved source, with exact large candidates', () => {
  for (const [dividend, divisor] of [
    [31, 1],
    [10, 3],
    [-2147483648, 1],
    [-2147483648, -2147483648],
    [0, -5],
  ]) {
    const frames = trace.createFrames({ dividend, divisor });
    assert.deepEqual(
      frames.filter((f) => f.data.action === 'compare').map((f) => f.data.i),
      Array.from({ length: 32 }, (_, i) => 31 - i),
    );
    assert.equal(frames.at(-1).data.i, -1);
    for (let n = 1; n < frames.length; n++) {
      const d = frames[n].data,
        old = frames[n - 1].data,
        c = d.current;
      if (d.action === 'compare') {
        assert.equal(BigInt(c.candidate), BigInt(d.divisor) << BigInt(c.bit));
        assert.equal(c.fits, BigInt(c.candidate) <= BigInt(c.before));
        assert.equal(d.dividend, old.dividend);
        assert.equal(d.res, old.res);
      }
      if (d.action === 'subtract') {
        assert.equal(d.dividend, Number(BigInt(old.dividend) - BigInt(c.candidate)));
        assert.equal(d.res, old.res);
        assert.equal(c.state, 'subtracted');
      }
      if (d.action === 'commit') {
        assert.equal(d.res, old.res + 2 ** c.bit);
        assert.equal(d.dividend, old.dividend);
        assert.equal(
          BigInt(d.divisor) * BigInt(d.res) + BigInt(d.dividend),
          BigInt(Math.abs(dividend)),
        );
      }
      if (d.action.startsWith('next-')) {
        assert.equal(d.i, old.i - 1);
        assert.equal(d.res, old.res);
        assert.equal(d.dividend, old.dividend);
        assert.equal(frames[n].codeLines[0], d.action === 'next-rejected' ? 20 : 24);
      }
    }
    const last = frames.at(-1).data;
    assert.ok(last.dividend < last.divisor);
  }
  const huge = trace
    .createFrames({ dividend: -2147483648, divisor: -2147483648 })
    .find((f) => f.data.action === 'compare').data;
  assert.equal(huge.current.candidate, '4611686018427387904');
});
test('Overflow returns before initialization; magnitudes, signs and zero follow Python semantics', () => {
  const overflow = trace.createFrames({ dividend: -2147483648, divisor: -1 });
  assert.deepEqual(
    overflow.map((f) => f.data.action),
    ['overflow-check', 'result'],
  );
  assert.equal(overflow.at(-1).data.res, null);
  assert.equal(overflow.at(-1).data.isNeg, null);
  for (const [a, b] of [
    [-7, 3],
    [7, -3],
    [-7, -3],
    [0, -1],
  ]) {
    const frames = trace.createFrames({ dividend: a, divisor: b }),
      last = frames.at(-1).data;
    assert.equal(last.isNeg, a < 0 !== b < 0);
    assert.equal(last.dividend, Math.abs(a) - Math.abs(b) * last.res);
    assert.equal(last.divisor, Math.abs(b));
    assert.ok(!Object.is(last.result, -0));
  }
  assert.ok(
    trace
      .createFrames({ dividend: -2147483648, divisor: 1 })
      .some((f) => f.data.action === 'dividend-magnitude' && f.data.dividend === 2147483648),
  );
});
test('Snapshots, canonical source lines and counting-before-allocation limit remain independent', () => {
  const lines = trace.referenceCode.split('\n');
  for (const p of visualizer.presets)
    for (const f of trace.createFrames(trace.parseInput(p.input))) {
      assert.equal(f.kind, 'divide-two-integers');
      assert.equal(f.codeLines.length, 1);
      assert.equal(lines[f.codeLines[0] - 1].trim(), f.codeFocus[0].trim());
    }
  const frames = trace.createFrames({ dividend: 10, divisor: 3 }),
    i = frames.findIndex((f) => f.data.action === 'subtract'),
    saved = JSON.stringify(frames.slice(i + 1));
  frames[i].data.current.before = -999;
  frames[i].data.checks[0].candidate = 'corrupt';
  assert.equal(JSON.stringify(frames.slice(i + 1)), saved);
  let count = 0;
  const clone = globalThis.structuredClone;
  globalThis.structuredClone = (v) => {
    count++;
    return clone(v);
  };
  try {
    assert.throws(
      () => trace.createFrames({ dividend: 10, divisor: 3 }, problem, 5),
      /Trace too large/,
    );
    assert.equal(count, 0);
  } finally {
    globalThis.structuredClone = clone;
  }
});
test('Parser rejects zero divisors, coercions, missing values and values outside signed 32 bits', () => {
  assert.deepEqual(trace.parseInput('{"dividend":-2147483648,"divisor":2147483647}'), {
    dividend: -2147483648,
    divisor: 2147483647,
  });
  for (const raw of [
    '{',
    'null',
    '[]',
    '{}',
    '{"dividend":1}',
    '{"dividend":1,"divisor":0}',
    '{"dividend":"1","divisor":2}',
    '{"dividend":true,"divisor":1}',
    '{"dividend":1.5,"divisor":2}',
    '{"dividend":2147483648,"divisor":1}',
    '{"dividend":1,"divisor":-2147483649}',
    '{"dividend":null,"divisor":2}',
  ])
    assert.throws(() => trace.parseInput(raw), raw);
  const html = renderToStaticMarkup(
    createElement(InputEditor, { raw: '{"dividend":-7,"divisor":3}', onChange: () => {} }),
  );
  for (const text of ['Fields', 'JSON', 'dividend', 'divisor', 'value="-7"'])
    assert.ok(html.includes(text));
  assert.ok(!html.includes('type="number"'));
});
test('Source-scoped aliases, shortcuts, comparison, bit inspector and answer render semantically', () => {
  for (const source_key of ['29', 'divide-two-integers'])
    assert.equal(getLesson({ ...problem, source_key }).adapter.id, visualizer.id);
  assert.equal(getLesson({ ...problem, source: 'atcoder' }).adapter.mode, 'generic');
  const frames = trace.createFrames({ dividend: 10, divisor: 3 });
  for (const action of ['subtract', 'result'])
    assert.equal(frames[nextJump(frames, 0, { action })].data.action, action);
  const pending = frames.find((f) => f.data.action === 'subtract'),
    html = renderToStaticMarkup(createElement(Canvas, { data: pending.data }));
  for (const text of [
    'Shift comparison workspace',
    'Quotient bit inspector',
    'Scrollable 32-bit quotient',
    'Inspect quotient bit 31',
    'Accepted chunk ledger',
    'quotient update pending',
    'Source state ledger',
  ])
    assert.ok(html.includes(text), text);
  const last = renderToStaticMarkup(createElement(Canvas, { data: frames.at(-1).data }));
  assert.ok(last.includes('Returned quotient: 3'));
  assert.ok(last.includes('remaining magnitude = 1'));
  const overflow = renderToStaticMarkup(
    createElement(Canvas, {
      data: trace.createFrames({ dividend: -2147483648, divisor: -1 }).at(-1).data,
    }),
  );
  assert.ok(overflow.includes('all shift checks are skipped'));
  assert.ok(overflow.includes('Returned quotient: 2147483647'));
});
