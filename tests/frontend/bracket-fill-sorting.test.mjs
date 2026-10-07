import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from './load-module.mjs';

const names = [
  'valid-parentheses',
  'minimum-add-parentheses',
  'score-parentheses',
  'valid-parenthesis-string',
  'flood-fill',
  'wiggle-sort',
];
const modules = await Promise.all(names.map((name) => load(`lessons/${name}/adapter.ts`)));
const [valid, add, score, wild, fill, wiggle] = modules.map((module) => module.visualizer);
const registry = await load('registry.tsx');
const problem = { source: 'leetcode', notes: {}, python_code: '' };
const trace = (adapter, value) => adapter.createFrames(value, problem);
const result = (adapter, value) => trace(adapter, value).at(-1).data.result;
function strings(alphabet, length, prefix = '') {
  if (!length) return [prefix];
  return [...alphabet].flatMap((c) => strings(alphabet, length - 1, prefix + c));
}
function validOracle(s) {
  let next;
  do {
    next = s.replace(/\(\)|\[\]|\{\}/g, '');
    if (next === s) break;
    s = next;
  } while (s);
  return s.length === 0;
}
function addOracle(s) {
  let balance = 0,
    missing = 0;
  for (const c of s) {
    balance += c === '(' ? 1 : -1;
    if (balance < 0) {
      missing++;
      balance = 0;
    }
  }
  return missing + balance;
}
function scoreOracle(s) {
  const stack = [0];
  for (const c of s) {
    if (c === '(') stack.push(0);
    else {
      const child = stack.pop();
      stack[stack.length - 1] += child === 0 ? 1 : 2 * child;
    }
  }
  return stack[0];
}
function wildOracle(s) {
  if (!s.includes('*')) return validOracle(s);
  return ['', '(', ')'].some((c) => wildOracle(s.replace('*', c)));
}
function checkFrames(adapter, frames) {
  const lines = adapter.referenceCode.split('\n');
  for (const frame of frames) {
    assert.equal(frame.codeFocus.length, 1);
    assert.equal(lines[frame.codeLines[0] - 1].trim(), frame.codeFocus[0]);
    assert.ok(frame.message && frame.title);
  }
  const original = structuredClone(frames.slice(1));
  for (const value of Object.values(frames[0].data))
    if (Array.isArray(value)) value.push('mutation');
  assert.deepEqual(frames.slice(1), original);
}
test('Valid Parentheses: exhaustive reduction oracle, LIFO, exact branch occurrence mapping', () => {
  for (let n = 1; n <= 4; n++)
    for (const s of strings('(){}[]', n)) assert.equal(result(valid, { s }), validOracle(s), s);
  const frames = trace(valid, { s: '({[]})' });
  const pops = frames.filter((f) => f.data.action === 'pop');
  assert.deepEqual(
    pops.map((f) => f.codeLines[0]),
    [17, 15, 13],
  );
  for (const p of pops)
    assert.ok(!p.data.stack.some((x) => x.index === p.data.matches.at(-1).open));
  assert.equal(result(valid, { s: '('.repeat(32) }), false);
  checkFrames(valid, frames);
});
test('Minimum Add: exhaustive balance oracle and final remaining-opening accounting', () => {
  for (let n = 1; n <= 9; n++)
    for (const s of strings('()', n)) assert.equal(result(add, { s }), addOracle(s));
  for (const preset of add.presets) {
    const frames = trace(add, add.parseInput(preset.input));
    for (let i = 1; i < frames.length; i++) {
      const d = frames[i].data,
        p = frames[i - 1].data;
      if (d.action === 'missing-open') assert.equal(d.count, p.count + 1);
      if (d.action === 'finish') assert.equal(d.count, p.count + p.stack.length);
    }
    checkFrames(add, frames);
  }
});
test('Score: nested-stack oracle, decrement before leaf contribution and non-leaf no-op', () => {
  for (let n = 2; n <= 10; n += 2)
    for (const s of strings('()', n).filter(validOracle))
      assert.equal(result(score, { s }), scoreOracle(s));
  const frames = trace(score, { s: '(()(()))' });
  assert.equal(frames.at(-1).data.result, 6);
  for (let i = 1; i < frames.length; i++) {
    const d = frames[i].data,
      p = frames[i - 1].data;
    if (d.action === 'close') assert.equal(d.depth, p.depth - 1);
    if (d.action === 'contribute') {
      assert.equal(d.depth, p.depth);
      assert.equal(d.total, p.total + 2 ** d.depth);
      assert.equal(d.s[d.index - 1], '(');
    }
  }
  assert.equal(result(score, { s: '('.repeat(16) + ')'.repeat(16) }), 32768);
  checkFrames(score, frames);
});
test('Wildcard: exhaustive expansion oracle, LIFO resources, ordering and honest star roles', () => {
  for (let n = 1; n <= 7; n++)
    for (const s of strings('()*', n)) {
      const frames = trace(wild, { s }),
        d = frames.at(-1).data;
      assert.equal(d.result, wildOracle(s), s);
      if (d.result) {
        const roles = new Map(d.roles.map((r) => [r.index, r.role]));
        const witness = [...s]
          .map((c, i) => (c !== '*' ? c : { opening: '(', closing: ')', empty: '' }[roles.get(i)]))
          .join('');
        assert.equal(validOracle(witness), true, s);
      }
      for (let i = 1; i < frames.length; i++) {
        const state = frames[i].data,
          p = frames[i - 1].data;
        if (state.action === 'pop-open') assert.deepEqual(state.openings, p.openings.slice(0, -1));
        if (state.action === 'pop-star') assert.deepEqual(state.stars, p.stars.slice(0, -1));
      }
    }
  assert.equal(result(wild, { s: '*(' }), false);
  checkFrames(wild, trace(wild, { s: '(*))' }));
});
function fillOracle({ image, sr, sc, color }) {
  const answer = structuredClone(image),
    original = image[sr][sc],
    seen = new Set();
  function dfs(r, c) {
    if (
      r < 0 ||
      r >= image.length ||
      c < 0 ||
      c >= image[0].length ||
      seen.has(`${r},${c}`) ||
      image[r][c] !== original
    )
      return;
    seen.add(`${r},${c}`);
    answer[r][c] = color;
    dfs(r - 1, c);
    dfs(r, c - 1);
    dfs(r + 1, c);
    dfs(r, c + 1);
  }
  dfs(sr, sc);
  return { answer, seen };
}
test('Flood Fill: independent component oracle, duplicate IDs, short circuits, unchanged input', () => {
  const inputs = fill.presets.map((p) => fill.parseInput(p.input));
  for (let seed = 0; seed < 50; seed++)
    inputs.push({
      image: Array.from({ length: 1 + (seed % 8) }, (_, r) =>
        Array.from({ length: 1 + (seed % 10) }, (_, c) => (r * 13 + c * 7 + seed) % 3),
      ),
      sr: 0,
      sc: 0,
      color: seed % 3,
    });
  inputs.push({
    image: Array.from({ length: 8 }, () => Array(10).fill(1)),
    sr: 0,
    sc: 0,
    color: 1,
  });
  for (const input of inputs) {
    const original = structuredClone(input),
      frames = trace(fill, input),
      final = frames.at(-1).data,
      oracle = fillOracle(input);
    assert.deepEqual(final.result, oracle.answer);
    assert.deepEqual(input, original);
    assert.equal(final.processed, oracle.seen.size);
    assert.equal(new Set(final.seen.map((x) => x.join(','))).size, final.processed);
    const changed = oracle.answer.flat().filter((v, i) => v !== input.image.flat()[i]).length;
    assert.equal(final.changed, changed);
    const ids = [];
    for (let i = 1; i < frames.length; i++) {
      const d = frames[i].data,
        p = frames[i - 1].data;
      if (d.action === 'dequeue') {
        assert.deepEqual(d.active, p.queue[0]);
        assert.deepEqual(d.queue, p.queue.slice(1));
        ids.push(d.active.id);
      }
      if (d.action === 'mark') assert.equal(d.seen.length, p.seen.length + 1);
      if (d.action === 'skip') {
        assert.deepEqual(d.image, p.image);
        assert.deepEqual(d.seen, p.seen);
      }
      if (d.action === 'compare') {
        let stopped = false;
        for (const check of d.checks) {
          assert.equal(check.value === null, stopped);
          if (check.value === false) stopped = true;
        }
      }
    }
    assert.equal(new Set(ids).size, ids.length);
    checkFrames(fill, frames);
  }
  const duplicate = trace(fill, {
    image: [
      [1, 1],
      [1, 1],
    ],
    sr: 0,
    sc: 0,
    color: 2,
  });
  assert.ok(duplicate.some((f) => f.data.action === 'skip'));
  assert.deepEqual(
    duplicate
      .filter((f) => f.data.action === 'neighbor')
      .slice(0, 4)
      .map((f) => f.data.candidate),
    [
      [0, 1],
      [1, 0],
      [-1, 0],
      [0, -1],
    ],
  );
});
function wiggleOracle(nums) {
  const counts = new Map();
  for (const n of nums) counts.set(n, (counts.get(n) || 0) + 1);
  function next(path) {
    if (path.length === nums.length) return path;
    for (const [value, count] of counts)
      if (
        count &&
        (!path.length || (path.length % 2 ? path.at(-1) < value : path.at(-1) > value))
      ) {
        counts.set(value, count - 1);
        const answer = next([...path, value]);
        counts.set(value, count);
        if (answer) return answer;
      }
    return null;
  }
  return next([]);
}
test('Wiggle Sort: exhaustive multiset permutation feasibility, exact pointer writes and in-place destination', () => {
  for (let n = 1; n <= 7; n++)
    for (const nums of strings('012', n)
      .map((s) => [...s].map(Number))
      .filter((a) => a.every((v, i) => !i || v >= a[i - 1]))) {
      const feasible = wiggleOracle(nums);
      if (!feasible) {
        assert.throws(() => wiggle.parseInput(JSON.stringify({ nums })));
        continue;
      }
      const frames = trace(wiggle, { nums }),
        final = frames.at(-1).data;
      assert.deepEqual(
        [...final.result].sort((a, b) => a - b),
        nums,
      );
      assert.equal(modules[5].isWiggle(final.result), true);
      assert.deepEqual(frames[0].data.nums, nums);
      for (let i = 1; i < frames.length; i++) {
        const d = frames[i].data,
          p = frames[i - 1].data;
        if (d.action === 'write') {
          assert.equal(d.nums[d.transfer.destination], d.sorted[d.transfer.source].value);
          assert.equal(d.transfer.destination, p.z);
          assert.equal(d.transfer.source, d.transfer.kind === 'valley' ? p.i : p.j);
        }
      }
      assert.equal(new Set(final.sorted.map((x) => x.id)).size, n);
      checkFrames(wiggle, frames);
    }
  assert.throws(() => wiggle.parseInput('{"nums":[1,1,2,2,2]}'));
});
test('Six lessons: parser rejection, reference bytes, numeric aliases and semantic render coverage', () => {
  const aliases = ['20', '921', '856', '678', '733', '324'];
  for (let i = 0; i < modules.length; i++) {
    const adapter = modules[i].visualizer;
    assert.equal(
      adapter.referenceCode,
      readFileSync(`src/features/visualizers/lessons/${names[i]}/reference.py`, 'utf8').trimEnd(),
    );
    for (const alias of [adapter.id, aliases[i]])
      assert.equal(registry.getLesson({ ...problem, source_key: alias }).adapter.id, adapter.id);
    for (const raw of ['{', 'null', '[]', '{}']) assert.throws(() => adapter.parseInput(raw));
    for (const preset of adapter.presets) {
      const frames = trace(adapter, adapter.parseInput(preset.input));
      const lesson = registry.getLesson({ ...problem, source_key: adapter.id });
      for (const frame of [frames[0], frames[Math.floor(frames.length / 2)], frames.at(-1)]) {
        const html = renderToStaticMarkup(createElement(lesson.Canvas, { frame, problem }));
        assert.match(html, /Operation and state/);
        assert.match(html, /Scrollable|Working image/);
        assert.ok(!html.includes('NaN'));
      }
      checkFrames(adapter, frames);
    }
  }
  for (const adapter of [valid, add, score, wild])
    for (const s of ['', 'x', 'a b', '('.repeat(33)])
      assert.throws(() => adapter.parseInput(JSON.stringify({ s })));
  for (const s of ['(', ')(', '(())('])
    assert.throws(() => score.parseInput(JSON.stringify({ s })));
  for (const value of [
    { image: [[1], [0, 1]], sr: 0, sc: 0, color: 2 },
    { image: [[true]], sr: 0, sc: 0, color: 2 },
    { image: [[1]], sr: 1, sc: 0, color: 2 },
    { image: [[1]], sr: 0, sc: -1, color: 2 },
    { image: [[1]], sr: 0, sc: 0, color: 10 },
  ])
    assert.throws(() => fill.parseInput(JSON.stringify(value)));
  for (const nums of [[], [1.5], [-1], [true], Array(13).fill(1), [5001]])
    assert.throws(() => wiggle.parseInput(JSON.stringify({ nums })));
});
