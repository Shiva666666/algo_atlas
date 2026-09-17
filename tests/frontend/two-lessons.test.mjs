import { server, load } from './load-module.mjs';
import assert from 'node:assert/strict';
import { after, test } from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const m = Object.assign(
  {},
  ...(await Promise.all([
    server.ssrLoadModule('/src/features/visualizers/lessons/repeated-substring/adapter.ts'),
    server.ssrLoadModule('/src/features/visualizers/lessons/max-area-island/adapter.ts'),
  ])),
);
const { RepeatedSubstringCanvas, IslandCanvas } = Object.assign(
  {},
  ...(await Promise.all([
    server.ssrLoadModule('/src/features/visualizers/lessons/repeated-substring/Canvas.tsx'),
    server.ssrLoadModule('/src/features/visualizers/lessons/max-area-island/Canvas.tsx'),
  ])),
);
const { StructuredInputEditor: TwoLessonInputEditor } = await server.ssrLoadModule(
  '/src/features/visualizers/components/StructuredInputEditor.tsx',
);
const { getVisualizer } = await server.ssrLoadModule('/src/features/visualizers/registry.tsx');
function periodOracle(s) {
  for (let p = 1; p < s.length; p++)
    if (s.length % p === 0 && Array.from(s).every((char, i) => char === s[i % p])) return true;
  return false;
}
function bfsOracle(grid) {
  const visited = new Set();
  const areas = [];
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++) {
      if (!grid[r][c] || visited.has(r + ',' + c)) continue;
      const queue = [[r, c]];
      visited.add(r + ',' + c);
      for (let head = 0; head < queue.length; head++) {
        const [row, col] = queue[head];
        for (const [nr, nc] of [
          [row - 1, col],
          [row + 1, col],
          [row, col - 1],
          [row, col + 1],
        ]) {
          const key = nr + ',' + nc;
          if (grid[nr]?.[nc] === 1 && !visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }
      areas.push(queue.length);
    }
  return { areas, max: Math.max(0, ...areas) };
}
function assertSource(frames, code) {
  for (const f of frames) {
    assert.equal(f.codeFocus.length, 1);
    assert.equal(f.codeLines.length, 1);
    assert.equal(code.split('\n')[f.codeLines[0] - 1].trim(), f.codeFocus[0]);
  }
}
test('Prefix tiling: exhaustive periodicity oracle, candidates, equality, and early return', () => {
  for (let n = 1; n <= 8; n++)
    for (let mask = 0; mask < 2 ** n; mask++) {
      const s = Array.from({ length: n }, (_, i) => ((mask >> i) & 1 ? 'a' : 'b')).join('');
      const frames = m.createRepeatedFrames({ s });
      assert.equal(frames.at(-1).data.result, periodOracle(s));
      const candidates = frames
        .filter((f) => f.data.action === 'candidate')
        .map((f) => f.data.length);
      assert.deepEqual(
        candidates,
        Array.from({ length: candidates.length }, (_, i) => i + 1),
      );
      for (const { data: d } of frames) {
        if (d.action === 'divisibility') assert.equal(d.remainder, n % d.length);
        if (d.action === 'prefix') assert.equal(d.prefix, s.slice(0, d.length));
        if (d.action === 'construct') {
          assert.equal(d.built, d.prefix.repeat(n / d.length));
          assert.equal(d.comparison, null);
        }
        if (d.action === 'comparison') {
          assert.equal(d.comparison, d.built === s);
          assert.deepEqual(
            d.mismatches,
            Array.from(s).flatMap((v, i) => (v !== d.built[i] ? [i] : [])),
          );
        }
      }
      if (frames.at(-1).data.result) assert.equal(frames.at(-2).data.action, 'comparison');
    }
  for (const p of m.repeatedSubstringVisualizer.presets) {
    const frames = m.createRepeatedFrames(JSON.parse(p.input));
    assertSource(frames, m.repeatedSubstringCode);
  }
  const single = m.createRepeatedFrames({ s: 'a' });
  assert.equal(single.length, 2);
  const skipped = m
    .createRepeatedFrames({ s: 'ababac' })
    .find((f) => f.data.action === 'divisibility' && f.data.remainder);
  // n=6 has no non-divisors before n/2; use length 8 to prove skip length 3.
  assert.equal(skipped, undefined);
  const nonDivisor = m
    .createRepeatedFrames({ s: 'abcdefga' })
    .find((f) => f.data.action === 'divisibility' && f.data.length === 3).data;
  assert.equal(nonDivisor.remainder, 2);
  assert.equal(nonDivisor.prefix, '');
  assert.equal(nonDivisor.copies, null);
});
test('Island DFS: exhaustive 3x3 grids agree with independent BFS component oracle', () => {
  for (let mask = 0; mask < 512; mask++) {
    const grid = Array.from({ length: 3 }, (_, r) =>
      Array.from({ length: 3 }, (_, c) => (mask >> (r * 3 + c)) & 1),
    );
    const before = JSON.stringify(grid);
    const final = m.createIslandFrames({ grid }).at(-1).data;
    const oracle = bfsOracle(grid);
    assert.equal(final.result, oracle.max);
    assert.deepEqual(
      final.islands.map((i) => i.area),
      oracle.areas,
    );
    assert.equal(final.seen.length, grid.flat().filter(Boolean).length);
    assert.equal(JSON.stringify(grid), before);
  }
  assert.equal(m.createIslandFrames({ grid: m.officialIslandGrid }).at(-1).data.result, 6);
  const bounded = m.createIslandFrames({
    grid: Array.from({ length: 10 }, () => Array(13).fill(1)),
  });
  assert.equal(bounded.at(-1).data.result, 130);
  assert.ok(bounded.length < 6000);
});
test('Island DFS: exact traversal, water returns, short circuit, subtotals and max timing', () => {
  for (const preset of m.maxAreaIslandVisualizer.presets) {
    const grid = JSON.parse(preset.input).grid;
    const frames = m.createIslandFrames({ grid });
    assertSource(frames, m.maxAreaIslandCode);
    const directions = new Map();
    const waterCalls = new Map();
    for (let i = 0; i < frames.length; i++) {
      const d = frames[i].data,
        prev = frames[i - 1]?.data,
        top = d.stack.at(-1);
      assert.deepEqual(d.grid, grid);
      assert.equal(new Set(d.seen).size, d.seen.length);
      for (const key of d.seen) {
        const [r, c] = key.split(',').map(Number);
        assert.equal(grid[r][c], 1);
      }
      if (d.action === 'direction') {
        const seq = directions.get(top.id) ?? [];
        seq.push(top.direction);
        directions.set(top.id, seq);
      }
      if (d.action === 'mark') {
        assert.equal(d.seen.length, (prev?.seen.length ?? 0) + 1);
        assert.ok(d.seen.includes(top.cell.join(',')));
      }
      if (d.action === 'neighbor-check') {
        const {
          cell: [r, c],
          rowInBounds,
          columnInBounds,
          unseen,
          passes,
        } = d.neighbor;
        assert.equal(rowInBounds, r >= 0 && r < grid.length);
        assert.equal(columnInBounds, rowInBounds ? c >= 0 && c < grid[0].length : null);
        assert.equal(unseen, columnInBounds === true ? !d.seen.includes(r + ',' + c) : null);
        assert.equal(passes, unseen === true);
      }
      if (d.action === 'return') {
        assert.equal(top.id, d.returned.callId);
        if (grid[top.cell[0]][top.cell[1]] === 0) {
          assert.equal(d.returned.value, 0);
          assert.ok(!d.seen.includes(top.cell.join(',')));
          const key = top.cell.join(',');
          waterCalls.set(key, (waterCalls.get(key) ?? 0) + 1);
        } else {
          assert.equal(d.returned.value, top.localArea);
          assert.deepEqual(directions.get(top.id), [0, 1, 2, 3]);
        }
      }
      if (d.action === 'accumulate') {
        assert.equal(prev.action, 'return');
        assert.equal(d.addition.child, prev.returned.value);
        assert.equal(d.stack.length, prev.stack.length - 1);
        assert.equal(top.id, prev.returned.parentId);
        assert.equal(d.addition.total, d.addition.old + d.addition.child);
        assert.equal(top.localArea, d.addition.total);
        assert.equal(d.addition.old, prev.stack.at(-2).localArea);
      }
      if (prev && d.maxArea !== prev.maxArea) {
        assert.equal(d.action, 'island-done');
        assert.equal(prev.action, 'return');
        assert.equal(prev.returned.parentId, null);
      }
    }
    const scans = frames.filter((f) => f.data.action === 'scan').map((f) => f.data.scan);
    assert.deepEqual(
      scans,
      grid.flatMap((row, r) => row.map((_, c) => [r, c])),
    );
  }
  const water = m
    .createIslandFrames({
      grid: [
        [1, 0],
        [1, 1],
      ],
    })
    .filter(
      (f) =>
        f.data.action === 'return' &&
        f.data.returned.value === 0 &&
        f.data.returned.cell.join(',') === '0,1',
    );
  assert.equal(water.length, 2);
});
test('Two lessons: strict validation and independent mutable snapshot storage', () => {
  for (const raw of [
    '{bad',
    '[]',
    'null',
    '{}',
    '{"s":3}',
    '{"s":""}',
    '{"s":"Ab"}',
    '{"s":"a b"}',
    '{"s":"é"}',
    JSON.stringify({ s: 'a'.repeat(33) }),
  ])
    assert.throws(() => m.parseRepeatedInput(raw));
  for (const raw of [
    '{bad',
    '[]',
    '{}',
    '{"grid":[]}',
    '{"grid":[[]]}',
    '{"grid":[[1],[0,1]]}',
    '{"grid":[["1"]]}',
    '{"grid":[[true]]}',
    '{"grid":[[2]]}',
    JSON.stringify({ grid: Array.from({ length: 11 }, () => [1]) }),
    JSON.stringify({ grid: [Array(14).fill(0)] }),
  ])
    assert.throws(() => m.parseIslandInput(raw));
  const a = m.createRepeatedFrames({ s: 'abab' });
  const aNext = JSON.stringify(a[1]);
  a[0].data.candidates[0].status = 'mismatch';
  assert.equal(JSON.stringify(a[1]), aNext);
  const b = m.createIslandFrames({
    grid: [
      [1, 1],
      [0, 1],
    ],
  });
  const idx = b.findIndex((f) => f.data.action === 'accumulate');
  const next = JSON.stringify(b[idx + 1]);
  b[idx].data.grid[0][0] = 9;
  b[idx].data.stack[0].cell[0] = 9;
  b[idx].data.seen.push('9,9');
  assert.equal(JSON.stringify(b[idx + 1]), next);
});
test('Two lessons: slug/numeric registry and semantic rendering', () => {
  for (const key of ['459', 'repeated-substring-pattern'])
    assert.equal(
      getVisualizer({ source: 'leetcode', source_key: key }).id,
      'repeated-substring-pattern',
    );
  for (const key of ['695', 'max-area-of-island'])
    assert.equal(getVisualizer({ source: 'leetcode', source_key: key }).id, 'max-area-of-island');
  const repeated = m.createRepeatedFrames({ s: 'abab' }).at(-1).data;
  const r = renderToStaticMarkup(React.createElement(RepeatedSubstringCanvas, { data: repeated }));
  for (const text of [
    'Original vs reconstruction',
    'Divisibility ledger',
    'Lengths tried in code order',
    'Return value',
    'True',
  ])
    assert.ok(r.toLowerCase().includes(text.toLowerCase()), text);
  const island = m.createIslandFrames({
    grid: [
      [1, 1],
      [0, 1],
    ],
  });
  for (const data of [
    island.find((f) => f.data.action === 'accumulate').data,
    island.at(-1).data,
  ]) {
    const html = renderToStaticMarkup(React.createElement(IslandCanvas, { data }));
    for (const text of [
      '<caption>',
      'scope="row"',
      'DFS call stack',
      'Return and subtotal ledger',
      'Maximum island area',
      'Completed islands',
    ])
      assert.ok(html.includes(text), text);
  }
  for (const [kind, raw] of [
    ['prefix-string', '{"s":"abab"}'],
    ['island-grid', '{"grid":[[1,0]]}'],
  ]) {
    const html = renderToStaticMarkup(
      React.createElement(TwoLessonInputEditor, {
        kind,
        raw,
        parseGrid: m.parseIslandInput,
        onChange: () => {},
      }),
    );
    assert.ok(html.includes('role="tablist"'));
    assert.ok(html.includes('role="tabpanel"'));
    assert.ok(html.includes('JSON'));
  }
});
