import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from './load-module.mjs';
const course = await load('lessons/course-schedule-three/trace.ts');
const decode = await load('lessons/decode-xored-array/trace.ts');
const { visualizer: courses } = await load('lessons/course-schedule-three/adapter.ts');
const { visualizer: decoder } = await load('lessons/decode-xored-array/adapter.ts');
const { Canvas: CourseCanvas } = await load('lessons/course-schedule-three/Canvas.tsx');
const { Canvas: DecodeCanvas } = await load('lessons/decode-xored-array/Canvas.tsx');
const { InputEditor: CourseInput } = await load('lessons/course-schedule-three/InputEditor.tsx');
const { InputEditor: DecodeInput } = await load('lessons/decode-xored-array/InputEditor.tsx');
const { getLesson } = await load('registry.tsx');
const { nextJump } = await load('core/lesson.tsx');
const problem = {
  source: 'leetcode',
  source_key: '',
  title: 'Fixture',
  notes: {},
  taxonomy: [],
  primary_subtag: { slug: 'scheduling' },
  primary_main: { slug: 'greedy' },
};
function oracle(input) {
  let best = 0;
  for (let mask = 0; mask < 2 ** input.length; mask++) {
    const selected = input.filter((_, i) => mask & (2 ** i)).sort((a, b) => a[1] - b[1]);
    let total = 0;
    if (selected.every(([duration, deadline]) => (total += duration) <= deadline))
      best = Math.max(best, selected.length);
  }
  return best;
}
function xorBits(a, b) {
  let result = 0,
    power = 1;
  while (a || b) {
    if (a % 2 !== b % 2) result += power;
    a = Math.floor(a / 2);
    b = Math.floor(b / 2);
    power *= 2;
  }
  return result;
}
let seed = 6301720;
const random = (maximum) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % maximum;
};
test('Deadline heap answers match exhaustive subset feasibility, including all edge presets', () => {
  const answers = [3, 2, 1, 0, 1, 1, 2, 3, 2, 1];
  for (let i = 0; i < courses.presets.length; i++) {
    const input = course.parseInput(courses.presets[i].input);
    assert.equal(course.createFrames(input).at(-1).data.result, answers[i]);
    assert.equal(answers[i], oracle(input.courses));
  }
  for (let trial = 0; trial < 150; trial++) {
    const input = {
      courses: Array.from({ length: 1 + random(8) }, () => [1 + random(9), 1 + random(20)]),
    };
    const before = JSON.stringify(input),
      frames = course.createFrames(input);
    assert.equal(frames.at(-1).data.result, oracle(input.courses), before);
    assert.equal(JSON.stringify(input), before);
    for (const { data: d } of frames) {
      if (d.heap)
        for (let child = 1; child < d.heap.length; child++)
          assert.ok(d.heap[(child - 1) >> 1] <= d.heap[child]);
      if (d.pending === null && d.total !== null) {
        assert.equal(d.total, -d.heap.reduce((sum, value) => sum + value, 0) || 0);
        assert.deepEqual(
          d.selected.map((id) => -d.original[id].duration).sort((a, b) => a - b),
          [...d.heap].sort((a, b) => a - b),
        );
        let finish = 0;
        for (const id of d.selected)
          assert.ok((finish += d.original[id].duration) <= d.original[id].deadline);
      }
    }
  }
});
test('Course source timing preserves total-before-push, partial replacements and short circuit', () => {
  const frames = course.createFrames({
    courses: [
      [5, 5],
      [4, 6],
      [2, 6],
    ],
  });
  for (let i = 1; i < frames.length; i++) {
    const d = frames[i].data,
      old = frames[i - 1].data;
    if (d.action === 'accept-total') {
      assert.equal(d.total, old.total + d.courses[d.index].duration);
      assert.deepEqual(d.heap, old.heap);
      assert.deepEqual(d.selected, old.selected);
      assert.equal(d.pending, 'accept');
    }
    if (d.action === 'remove') {
      assert.equal(d.heap.length, old.heap.length - 1);
      assert.equal(d.total, old.total - d.removed);
      assert.deepEqual(d.selected, old.selected);
      assert.equal(d.pending, 'replace');
    }
    if (d.action === 'replace-total') {
      assert.equal(d.total, old.total + d.courses[d.index].duration);
      assert.deepEqual(d.selected, old.selected);
      assert.deepEqual(d.heap, old.heap);
    }
    if (['accept', 'replace', 'skip'].includes(d.action))
      assert.equal(d.events.length, d.index + 1);
    if (d.action === 'replace') assert.equal(d.heap.length, old.heap.length + 1);
    if (d.action === 'fit-check') assert.equal(d.fit, d.courses[d.index].deadline >= d.proposal);
  }
  assert.equal(course.createFrames({ courses: [[3, 3]] }).at(-1).data.result, 1);
  const empty = course
    .createFrames({ courses: [[3, 2]] })
    .find((f) => f.data.action === 'replace-check').data;
  assert.equal(empty.shorter, null);
  assert.equal(empty.longest, null);
  const equal = course.createFrames({
    courses: [
      [2, 2],
      [2, 3],
    ],
  });
  assert.equal(equal.find((f) => f.data.action === 'replace-check').data.shorter, false);
  assert.equal(equal.filter((f) => f.data.action === 'replace').length, 0);
  const ties = course
    .createFrames({
      courses: [
        [2, 5],
        [1, 2],
        [1, 2],
      ],
    })
    .at(-1).data;
  assert.deepEqual(
    ties.courses.map((c) => c.id),
    [1, 2, 0],
  );
  assert.deepEqual([...ties.selected].sort(), [0, 1, 2]);
});
test('XOR recovery matches independent bit oracle and re-encodes its output', () => {
  const expected = [
    [1, 0, 2, 1],
    [4, 2, 0, 7, 4],
    [0, 0, 0, 0],
    [9, 9],
    [5, 2, 5, 2],
    [65536, 131071],
    [100000, 0],
    [0, 5],
  ];
  for (let i = 0; i < decoder.presets.length; i++)
    assert.deepEqual(
      decode.createFrames(decode.parseInput(decoder.presets[i].input)).at(-1).data.result,
      expected[i],
    );
  for (let trial = 0; trial < 150; trial++) {
    const input = {
      encoded: Array.from({ length: 1 + random(16) }, () => random(100001)),
      first: random(100001),
    };
    const expected = [input.first];
    for (const v of input.encoded) expected.push(xorBits(v, expected.at(-1)));
    const before = JSON.stringify(input),
      final = decode.createFrames(input).at(-1).data;
    assert.deepEqual(final.result, expected);
    assert.equal(JSON.stringify(input), before);
    assert.deepEqual(
      final.result.slice(1).map((v, i) => xorBits(final.result[i], v)),
      input.encoded,
    );
  }
});
test('XOR is computed before append and stable operands are not confused with the new output tail', () => {
  const frames = decode.createFrames({ encoded: [1, 2, 3], first: 1 });
  assert.deepEqual(frames[0].data.res, [1]);
  assert.equal(frames[0].data.real, null);
  for (let i = 1; i < frames.length; i++) {
    const d = frames[i].data,
      old = frames[i - 1].data;
    if (d.action === 'read') {
      assert.equal(d.board.result, null);
      assert.equal(d.real, old.real);
      assert.equal(d.board.previous, d.res.at(-1));
    }
    if (d.action === 'xor') {
      assert.deepEqual(d.res, old.res);
      assert.equal(d.real, xorBits(d.num, d.res.at(-1)));
    }
    if (d.action === 'append') {
      assert.deepEqual(d.res, [...old.res, old.real]);
      assert.deepEqual(d.board, old.board);
    }
  }
});
test('Both lesson snapshots and exact code focus remain independent and complete', () => {
  for (const [trace, adapter] of [
    [course, courses],
    [decode, decoder],
  ])
    for (const preset of adapter.presets) {
      const input = trace.parseInput(preset.input),
        frames = trace.createFrames(input),
        lines = trace.referenceCode.split('\n');
      for (const f of frames) {
        assert.equal(f.kind, adapter.id);
        assert.equal(f.codeLines.length, 1);
        assert.equal(lines[f.codeLines[0] - 1].trim(), f.codeFocus[0].trim());
      }
      const previous = JSON.stringify(frames.slice(1));
      if (trace === course) {
        frames[0].data.original[0].duration = -99;
        frames[0].data.courses.push({ id: -1 });
      } else {
        frames[0].data.encoded[0] = -99;
        frames[0].data.res.push(-1);
      }
      assert.equal(JSON.stringify(frames.slice(1)), previous);
      const middle = frames.findIndex(
        (f) => f.data.action === (trace === course ? 'replace' : 'xor'),
      );
      if (middle >= 0) {
        const after = JSON.stringify(frames.slice(middle + 1));
        if (trace === course) frames[middle].data.events[0].total = -999;
        else frames[middle].data.board.result = -999;
        assert.equal(JSON.stringify(frames.slice(middle + 1)), after);
      }
      let clones = 0;
      const clone = globalThis.structuredClone;
      globalThis.structuredClone = (v) => {
        clones++;
        return clone(v);
      };
      try {
        assert.throws(() => trace.createFrames(input, problem, 1), /Trace too large/);
        assert.equal(clones, 0);
      } finally {
        globalThis.structuredClone = clone;
      }
    }
  const frames = course.createFrames({
    courses: [
      [5, 5],
      [4, 6],
    ],
  });
  assert.ok(
    frames.find((f) => f.data.action === 'accept').codeLines[0] <
      frames.find((f) => f.data.action === 'replace').codeLines[0],
  );
});
test('Strict input bounds accept duplicate courses and zeros, rejecting incomplete or oversized fields', () => {
  assert.deepEqual(course.parseInput('[[1,2],[1,2]]'), {
    courses: [
      [1, 2],
      [1, 2],
    ],
  });
  for (const raw of [
    '{',
    'null',
    '{}',
    '[]',
    '[[0,1]]',
    '[[1,-1]]',
    '[[1,1.5]]',
    '[["1",2]]',
    '[[1,10001]]',
    '[[true,2]]',
    '[[1]]',
    '[[1,2,3]]',
    JSON.stringify(Array(13).fill([1, 2])),
  ])
    assert.throws(() => course.parseInput(raw), raw);
  for (const raw of [
    '{',
    'null',
    '{}',
    '[]',
    '{"encoded":[],"first":0}',
    '{"encoded":[0],"first":"1"}',
    '{"encoded":[true],"first":0}',
    '{"encoded":[-1],"first":0}',
    '{"encoded":[1.5],"first":0}',
    '{"encoded":[100001],"first":0}',
    JSON.stringify({ encoded: Array(17).fill(0), first: 0 }),
  ])
    assert.throws(() => decode.parseInput(raw), raw);
  assert.equal(
    course.createFrames({ courses: Array(12).fill([10000, 10000]) }).at(-1).data.result,
    1,
  );
  assert.equal(
    decode.createFrames({ encoded: Array(16).fill(0), first: 100000 }).at(-1).data.result.length,
    17,
  );
});
test('Registry, jumps and semantic diagrams expose committed versus pending state', () => {
  for (const [adapter, aliases] of [
    [courses, ['630', 'course-schedule-iii']],
    [decoder, ['1720', 'decode-xored-array']],
  ])
    for (const source_key of aliases) {
      assert.equal(getLesson({ ...problem, source_key }).adapter.id, adapter.id);
      assert.equal(
        getLesson({ ...problem, source: 'atcoder', source_key }).adapter.mode,
        'generic',
      );
    }
  const frames = course.createFrames({
    courses: [
      [5, 5],
      [4, 6],
      [2, 6],
    ],
  });
  assert.equal(frames[nextJump(frames, 0, { action: 'replace' })].data.action, 'replace');
  const courseHtml = renderToStaticMarkup(
    createElement(CourseCanvas, { data: frames.find((f) => f.data.action === 'remove').data }),
  );
  for (const label of [
    'Negative-duration heap',
    'Deadline-ordered courses',
    'Replacement in progress',
    'previous completed state',
    'Committed feasible schedule',
    'Decision history',
  ])
    assert.ok(courseHtml.includes(label), label);
  assert.ok(
    renderToStaticMarkup(createElement(CourseCanvas, { data: frames.at(-1).data })).includes(
      'Returned maximum course count: 2',
    ),
  );
  const xor = decode.createFrames({ encoded: [65535], first: 65536 });
  assert.equal(xor[nextJump(xor, 0, { action: 'xor' })].data.action, 'xor');
  const html = renderToStaticMarkup(
    createElement(DecodeCanvas, { data: xor.find((f) => f.data.action === 'xor').data }),
  );
  for (const label of [
    'Encoded XOR values',
    'Preview · append pending',
    'Scrollable XOR bit board',
    '131071',
    '17 bits',
  ])
    assert.ok(html.includes(label), label);
  for (const [Input, raw] of [
    [CourseInput, '{"courses":[[1,2]]}'],
    [DecodeInput, '{"encoded":[0],"first":0}'],
  ]) {
    const editor = renderToStaticMarkup(createElement(Input, { raw, onChange: () => {} }));
    assert.ok(editor.includes('Fields'));
    assert.ok(editor.includes('JSON'));
    assert.ok(
      !editor.includes('type="number"'),
      'Hidden native constraints must not block JSON builds',
    );
  }
});
