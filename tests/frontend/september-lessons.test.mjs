import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { load } from './load-module.mjs';

const triangle = await load('lessons/triangle/adapter.ts');
const depth = await load('lessons/maximum-nesting-depth/adapter.ts');
const squares = await load('lessons/perfect-squares/adapter.ts');
const good = await load('lessons/good-strings/adapter.ts');
const course = await load('lessons/course-schedule/adapter.ts');
const registry = await load('registry.tsx');
const problem = { source: 'leetcode', source_key: '', notes: {}, python_code: '' };
const last = (frames) => frames.at(-1).data;

function checkFrames(frames, code) {
  assert.ok(frames.length);
  for (const frame of frames) {
    assert.equal(frame.codeFocus.length, 1);
    assert.equal(code.split('\n')[frame.codeLines[0] - 1].trim(), frame.codeFocus[0]);
    assert.ok(frame.title && frame.message);
  }
  const original = structuredClone(frames);
  const rest = structuredClone(frames.slice(1));
  for (const value of Object.values(frames[0].data))
    if (Array.isArray(value)) value.push('snapshot mutation');
  assert.deepEqual(frames.slice(1), rest);
  for (const frame of frames) frame.data.action = 'mutated';
  assert.deepEqual(original.map((f) => f.data.action).includes('mutated'), false);
}
function triangleOracle(rows, r = 0, c = 0) {
  if (r === rows.length - 1) return rows[r][c];
  return rows[r][c] + Math.min(triangleOracle(rows, r + 1, c), triangleOracle(rows, r + 1, c + 1));
}
function depthOracle(s) {
  const stack = [];
  let best = 0;
  for (const c of s) {
    if (c === '(') stack.push(c);
    if (c === ')') stack.pop();
    best = Math.max(best, stack.length);
  }
  return best;
}
test('Triangle: presets, exhaustive paths, dependencies, boundaries and independent snapshots', () => {
  const adapter = triangle.triangleVisualizer;
  for (const preset of adapter.presets) {
    const input = adapter.parseInput(preset.input),
      original = structuredClone(input);
    const frames = adapter.createFrames(input, problem);
    assert.deepEqual(input, original);
    assert.equal(last(frames).result, triangleOracle(input.triangle));
    assert.equal(
      last(frames).path.reduce((sum, [r, c]) => sum + input.triangle[r][c], 0),
      last(frames).result,
    );
    for (let f = 1; f < frames.length; f++) {
      const current = frames[f].data,
        previous = frames[f - 1].data;
      for (const [r, c] of current.parents) {
        assert.equal(r, current.active[0] - 1);
        assert.ok(c === current.active[1] || c === current.active[1] - 1);
      }
      if (current.action === 'compare') assert.deepEqual(current.dp, previous.dp);
      assert.notEqual(current.dp, previous.dp);
    }
    checkFrames(frames, adapter.referenceCode);
  }
  for (let seed = 0; seed < 20; seed++) {
    const rows = Array.from({ length: 1 + (seed % 8) }, (_, r) =>
      Array.from({ length: r + 1 }, (_, c) => ((seed * 7 + r * 11 + c * 13) % 19) - 9),
    );
    assert.equal(
      last(adapter.createFrames({ triangle: rows }, problem)).result,
      triangleOracle(rows),
    );
  }
  for (const raw of [
    '{}',
    '{"triangle":[]}',
    '{"triangle":[[1],[2]]}',
    '{"triangle":[[10001]]}',
    '{"triangle":[[true]]}',
    'null',
    '{',
  ])
    assert.throws(() => adapter.parseInput(raw));
  const maximum = Array.from({ length: 8 }, (_, r) => Array(r + 1).fill(-10000));
  assert.equal(last(adapter.createFrames({ triangle: maximum }, problem)).result, -80000);
  assert.throws(() =>
    adapter.parseInput(JSON.stringify({ triangle: [...maximum, Array(9).fill(0)] })),
  );
});
function hasCycle(n, pairs) {
  const adjacency = Array.from({ length: n }, () => []),
    color = Array(n).fill(0);
  for (const [a, b] of pairs) adjacency[b].push(a);
  function visit(v) {
    if (color[v] === 1) return true;
    if (color[v] === 2) return false;
    color[v] = 1;
    if (adjacency[v].some(visit)) return true;
    color[v] = 2;
    return false;
  }
  return Array.from({ length: n }, (_, i) => i).some(visit);
}
test('Course Schedule: DFS cycle oracle, FIFO, exact edge processing and partial failure', () => {
  const adapter = course.courseVisualizer;
  const inputs = adapter.presets.map((p) => adapter.parseInput(p.input));
  for (let seed = 0; seed < 50; seed++)
    inputs.push({
      numCourses: 1 + (seed % 12),
      prerequisites: Array.from({ length: 1 + (seed % 12) }, (_, a) =>
        Array.from({ length: 1 + (seed % 12) }, (_, b) => [a, b]),
      )
        .flat()
        .filter(([a, b]) => a !== b && (a * 17 + b * 19 + seed) % 11 === 0),
    });
  for (const input of inputs) {
    const frames = adapter.createFrames(input, problem),
      answer = last(frames).result;
    if (hasCycle(input.numCourses, input.prerequisites)) assert.deepEqual(answer, []);
    else {
      assert.equal(new Set(answer).size, input.numCourses);
      for (const [a, b] of input.prerequisites) assert.ok(answer.indexOf(b) < answer.indexOf(a));
    }
    const adjacency = Array.from({ length: input.numCourses }, () => []);
    for (const [a, b] of input.prerequisites) adjacency[b].push(a);
    const processedEdges = [];
    for (let i = 1; i < frames.length; i++) {
      const d = frames[i].data,
        p = frames[i - 1].data;
      assert.ok(d.indegree.every((x) => x >= 0));
      if (d.action === 'dequeue') {
        assert.equal(d.active, p.queue[0]);
        assert.deepEqual(d.queue, p.queue.slice(1));
        assert.equal(p.indegree[d.active], 0);
      }
      if (d.action === 'append') {
        assert.deepEqual(d.order, [...p.order, d.active]);
      }
      if (d.action === 'inspect') {
        assert.deepEqual(d.indegree, p.indegree);
        assert.ok(
          input.prerequisites.some(([a, b]) => a === d.inspected[1] && b === d.inspected[0]),
        );
        processedEdges.push(d.inspected);
      }
      if (d.action === 'decrement') {
        const to = d.inspected[1];
        assert.equal(d.indegree[to], p.indegree[to] - 1);
        for (let j = 0; j < input.numCourses; j++)
          if (j !== to) assert.equal(d.indegree[j], p.indegree[j]);
      }
      if (d.action === 'enqueue') {
        assert.deepEqual(d.queue.slice(0, -1), p.queue);
        assert.equal(d.indegree[d.queue.at(-1)], 0);
      }
    }
    assert.deepEqual(
      processedEdges,
      last(frames).order.flatMap((v) => adjacency[v].map((w) => [v, w])),
    );
    checkFrames(frames, adapter.referenceCode);
  }
  const partial = last(adapter.createFrames(inputs[5], problem));
  assert.deepEqual(partial.order, [0, 5, 1]);
  assert.deepEqual(partial.blocked, [2, 3, 4]);
  assert.deepEqual(partial.result, []);
  for (const input of [
    { numCourses: 0, prerequisites: [] },
    { numCourses: 13, prerequisites: [] },
    { numCourses: 2, prerequisites: [[1, 1]] },
    {
      numCourses: 2,
      prerequisites: [
        [1, 0],
        [1, 0],
      ],
    },
    { numCourses: 2, prerequisites: [[2, 0]] },
    { numCourses: 2, prerequisites: [[1]] },
    { numCourses: 2, prerequisites: null },
  ])
    assert.throws(() => adapter.parseInput(JSON.stringify(input)));
});
function squaresOracle(n) {
  const queue = [[n, 0]],
    seen = new Set([n]);
  for (let i = 0; i < queue.length; i++) {
    const [remainder, depth] = queue[i];
    if (!remainder) return depth;
    for (let k = 1; k * k <= remainder; k++)
      if (!seen.has(remainder - k * k)) {
        seen.add(remainder - k * k);
        queue.push([remainder - k * k, depth + 1]);
      }
  }
}
function goodOracle({ low, high, zero, one }) {
  const counts = Array(high + 1).fill(0);
  counts[0] = 1;
  for (let i = 1; i <= high; i++)
    counts[i] =
      ((i >= zero ? counts[i - zero] : 0) + (i >= one ? counts[i - one] : 0)) % 1000000007;
  return counts.slice(low).reduce((a, b) => (a + b) % 1000000007, 0);
}
function explicitStrings({ low, high, zero, one }) {
  const strings = new Set();
  function append(s) {
    if (s.length > high) return;
    if (s.length >= low) strings.add(s);
    append(s + '0'.repeat(zero));
    append(s + '1'.repeat(one));
  }
  append('');
  return strings.size;
}
test('Perfect Squares: BFS oracle, seeded hits, complete recursion and memo invariants', () => {
  const adapter = squares.squaresVisualizer;
  for (let n = 1; n <= 40; n++) {
    const frames = adapter.createFrames({ n }, problem);
    assert.equal(last(frames).result, squaresOracle(n));
    assert.ok(frames.some((f) => f.data.action === 'hit'));
    for (let i = 1; i < frames.length; i++) {
      const d = frames[i].data,
        p = frames[i - 1].data,
        c = d.calls.at(-1);
      for (let x = 0; x <= n; x++)
        if (d.memo[x] !== null) assert.equal(d.memo[x], squaresOracle(x));
      if (d.action === 'child-return') {
        assert.equal(c.children[0].result, squaresOracle(c.children[0].target));
        assert.equal(c.best, p.calls.find((v) => v.id === c.id).best);
      }
      if (d.action === 'write') assert.equal(d.memo[c.argument], c.best);
      if (d.action === 'break') assert.ok(c.choice > c.argument);
      assert.equal(d.memo[0], null);
      assert.ok(d.calls.every((call) => call.argument > 0));
    }
    checkFrames(frames, adapter.referenceCode);
  }
  for (const raw of ['{}', '{"n":0}', '{"n":41}', '{"n":1.5}', '{"n":true}', '{"n":"12"}'])
    assert.throws(() => adapter.parseInput(raw));
  assert.equal(last(adapter.createFrames({ n: 16 }, problem)).result, 1);
  assert.equal(
    adapter.createFrames({ n: 16 }, problem).filter((f) => f.data.action === 'call').length,
    0,
  );
});
test('Good Strings: explicit strings and bottom-up oracle, equal branches, overflow, pending returns', () => {
  const adapter = good.goodStringsVisualizer;
  for (const preset of adapter.presets)
    assert.equal(
      last(adapter.createFrames(adapter.parseInput(preset.input), problem)).result,
      goodOracle(adapter.parseInput(preset.input)),
    );
  for (let low = 1; low <= 7; low++)
    for (let high = low; high <= 9; high++)
      for (let zero = 1; zero <= low; zero++)
        for (let one = 1; one <= low; one++) {
          const input = { low, high, zero, one },
            frames = adapter.createFrames(input, problem);
          assert.equal(last(frames).result, goodOracle(input));
          if (high <= 6) assert.equal(last(frames).result, explicitStrings(input));
        }
  for (const input of [
    { low: 3, high: 3, zero: 1, one: 1 },
    { low: 3, high: 3, zero: 2, one: 2 },
    { low: 1, high: 24, zero: 1, one: 1 },
  ]) {
    const frames = adapter.createFrames(input, problem);
    for (let i = 1; i < frames.length; i++) {
      const d = frames[i].data,
        p = frames[i - 1].data,
        c = d.calls.at(-1);
      if (d.action === 'child-return')
        assert.equal(c.best, p.calls.find((v) => v.id === c.id).best);
      if (d.action === 'add') {
        assert.equal(c.children.length, 2);
        assert.ok(c.children.every((child) => child.result !== null));
        assert.equal(
          c.best,
          Number(c.argument >= input.low) + c.children.reduce((a, b) => a + b.result, 0),
        );
      }
      if (d.action === 'overflow') assert.ok(c.argument > input.high);
      if (d.action === 'write') assert.equal(d.memo[c.argument], c.best % 1000000007);
      assert.equal(d.memo[input.high], 1);
    }
    checkFrames(frames, adapter.referenceCode);
  }
  for (const input of [
    { low: 0, high: 3, zero: 1, one: 1 },
    { low: 4, high: 3, zero: 1, one: 1 },
    { low: 3, high: 25, zero: 1, one: 1 },
    { low: 3, high: 4, zero: 0, one: 1 },
    { low: 3, high: 4, zero: 1, one: 4 },
  ])
    assert.throws(() => adapter.parseInput(JSON.stringify(input)));
});
test('Depth: exact close-time maximum, balanced ranges and input contract', () => {
  const adapter = depth.depthVisualizer;
  for (const preset of adapter.presets) {
    const input = adapter.parseInput(preset.input),
      frames = adapter.createFrames(input, problem);
    assert.equal(last(frames).result, depthOracle(input.s));
    for (let f = 1; f < frames.length; f++) {
      const current = frames[f].data,
        previous = frames[f - 1].data;
      assert.ok(current.localDepth >= 0);
      if (current.action === 'maximum') {
        assert.equal(current.localDepth, previous.localDepth);
        assert.equal(current.maximum, Math.max(previous.localDepth, previous.maximum));
      }
      if (current.action === 'close') assert.equal(current.localDepth, previous.localDepth - 1);
      if (current.action === 'open') {
        assert.equal(current.localDepth, previous.localDepth + 1);
        assert.equal(current.maximum, previous.maximum);
      }
    }
    for (const range of last(frames).ranges) {
      assert.equal(input.s[range.start], '(');
      assert.equal(input.s[range.end], ')');
    }
    checkFrames(frames, adapter.referenceCode);
  }
  const max = '('.repeat(32) + ')'.repeat(32);
  assert.equal(last(adapter.createFrames({ s: max }, problem)).result, 32);
  for (const s of ['', '(', ')(', '(1', 'a', ' '.repeat(2), '1'.repeat(65)])
    assert.throws(() => adapter.parseInput(JSON.stringify({ s })));
  assert.equal(last(adapter.createFrames({ s: '1'.repeat(64) }, problem)).result, 0);
});
test('September lessons: reference source, registry aliases and semantic diagrams', () => {
  for (const [name, key, adapter] of [
    ['triangle', '120', triangle.triangleVisualizer],
    ['maximum-nesting-depth', '1614', depth.depthVisualizer],
    ['perfect-squares', '279', squares.squaresVisualizer],
    ['good-strings', '2466', good.goodStringsVisualizer],
    ['course-schedule', '210', course.courseVisualizer],
  ]) {
    assert.equal(
      adapter.referenceCode,
      readFileSync(`src/features/visualizers/lessons/${name}/reference.py`, 'utf8').trimEnd(),
    );
    for (const alias of [key, adapter.id])
      assert.equal(registry.getLesson({ ...problem, source_key: alias }).adapter.id, adapter.id);
    const lesson = registry.getLesson({ ...problem, source_key: key });
    const frames = adapter.createFrames(adapter.parseInput(adapter.presets[0].input), problem);
    for (const frame of [frames[0], frames[Math.floor(frames.length / 2)], frames.at(-1)]) {
      const html = renderToStaticMarkup(createElement(lesson.Canvas, { frame, problem }));
      assert.match(html, /Operation and state/);
      assert.match(html, /Scrollable/);
    }
  }
});
