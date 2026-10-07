import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from './load-module.mjs';
const { visualizer: adapter } = await load('lessons/remove-invalid-parentheses/adapter.ts');
const { Canvas } = await load('lessons/remove-invalid-parentheses/Canvas.tsx');
const { getLesson } = await load('registry.tsx');
const problem = {
  source: 'leetcode',
  source_key: '301',
  notes: {},
  python_code: adapter.referenceCode,
};
const trace = (s) => adapter.createFrames({ s }, problem);
const text = (tokens) => tokens.map((t) => t.value).join('');
// Independent breadth-first removal oracle, not the traced source's DFS/count scan.
function valid(s) {
  let balance = 0;
  for (const c of s) {
    if (c === '(') balance++;
    if (c === ')' && --balance < 0) return false;
  }
  return balance === 0;
}
function oracle(s) {
  let frontier = new Set([s]);
  while (frontier.size) {
    const answers = [...frontier].filter(valid);
    if (answers.length) return answers.sort();
    const next = new Set();
    for (const item of frontier)
      for (let i = 0; i < item.length; i++)
        if ('()'.includes(item[i])) next.add(item.slice(0, i) + item.slice(i + 1));
    frontier = next;
  }
  throw new Error('Oracle found no solution');
}
function strings(prefix, remaining) {
  return remaining ? [...'()a'].flatMap((c) => strings(prefix + c, remaining - 1)) : [prefix];
}
test('301 agrees with independent minimal-deletion oracle for presets and exhaustive short strings', () => {
  for (const preset of adapter.presets) {
    const { s } = adapter.parseInput(preset.input);
    const frames = trace(s),
      answers = frames.at(-1).data.result;
    assert.deepEqual([...answers].sort(), oracle(s));
    assert.equal(
      frames.find((f) => f.data.action === 'seal-budget').data.minimum,
      s.length - answers[0].length,
    );
  }
  for (let n = 1; n <= 5; n++)
    for (const s of strings('', n))
      assert.deepEqual([...trace(s).at(-1).data.result].sort(), oracle(s), s);
});
test('301 identities, shifted child indexes, branch order, and caller resumption follow source', () => {
  const frames = trace('(a)())()');
  for (let i = 0; i < frames.length; i++) {
    const d = frames[i].data;
    assert.equal(new Set(d.tokens.map((t) => t.index)).size, d.tokens.length);
    for (const t of d.tokens) assert.equal(t.value, d.s[t.index]);
    assert.equal(
      d.tokens
        .filter((t) => /[a-z]/.test(t.value))
        .map((t) => t.value)
        .join(''),
      'a',
    );
    if (d.action === 'delete') {
      const child = frames[i + 1].data,
        call = child.calls.at(-1);
      assert.equal(child.action, 'enter');
      assert.equal(call.ind, d.deletion.currentIndex);
      assert.equal(call.removes, d.calls.at(-1).removes + 1);
      assert.equal(text(child.tokens), d.deletion.nextString);
      assert.equal(
        child.tokens.some((t) => t.index === d.deletion.originalIndex),
        false,
      );
    }
    if (d.action === 'resume') assert.equal(text(d.tokens), text(d.calls.at(-1).tokens));
  }
  const rootChoices = frames
    .filter((f) => f.data.action === 'candidate' && f.data.calls.length === 1)
    .map((f) => f.data.activeIndex);
  assert.deepEqual(
    rootChoices,
    [...'(a)())()'].map((_, i) => i),
  );
  const firstAnswer = frames.findIndex((f) => f.data.action === 'record');
  assert.ok(frames.slice(firstAnswer + 1).some((f) => f.data.action === 'resume'));
});
test('301 counts, validator prefixes and accepted-only short-circuit deduplication are separate', () => {
  const frames = trace('())(');
  assert.ok(frames.some((f) => f.data.action === 'reject-counts'));
  assert.ok(frames.some((f) => f.data.action === 'reject-prefix'));
  const duplicateFrames = trace('()())()');
  const duplicateIndex = duplicateFrames.findIndex((f) => f.data.validation === 'duplicate');
  assert.ok(duplicateIndex >= 0);
  assert.equal(duplicateFrames[duplicateIndex + 1].data.action, 'leaf-return');
  for (const f of duplicateFrames) {
    for (const candidate of f.data.seen) assert.ok(valid(candidate));
    assert.equal(new Set(f.data.results).size, f.data.results.length);
    assert.ok(f.data.results.every((candidate) => f.data.seen.includes(candidate)));
    if (f.data.action === 'record')
      assert.equal(f.data.minimum, f.data.s.length - f.data.results.at(-1).length);
  }
  const clear = frames.find((f) => f.data.action === 'clear-stack').data;
  assert.equal(clear.countStack.length, 0);
  assert.equal(clear.results.length, 0);
});
test('301 snapshots and exact Python focus are independent and source-valid', () => {
  for (const preset of adapter.presets) {
    const frames = adapter.createFrames(adapter.parseInput(preset.input), problem);
    for (const f of frames) {
      for (const snippet of f.codeFocus) assert.ok(adapter.referenceCode.includes(snippet));
      assert.equal(
        adapter.referenceCode.split('\n')[f.codeLines[0] - 1].trim(),
        f.codeFocus[0].trim(),
      );
    }
    const baseline = JSON.stringify(frames.slice(1));
    frames[0].data.tokens[0].value = '!';
    frames[0].data.results.push('changed');
    frames[0].data.seen.push('changed');
    assert.equal(JSON.stringify(frames.slice(1)), baseline);
  }
});
test('301 rejects invalid inputs and excessive complete traces without claiming failure', () => {
  for (const raw of [
    '{',
    '{}',
    '[]',
    '{"s":1}',
    '{"s":""}',
    '{"s":"A"}',
    '{"s":"a b"}',
    '{"s":"*"}',
    JSON.stringify({ s: '('.repeat(13) }),
  ])
    assert.throws(() => adapter.parseInput(raw));
  assert.throws(() => trace(')'.repeat(12)), /Trace too large/);
  assert.deepEqual(trace('a').at(-1).data.result, ['a']);
  assert.deepEqual(trace(')(').at(-1).data.result, ['']);
});
test('301 registry, jump actions, and semantic workspace cover search, check, return and answers', () => {
  for (const source_key of ['remove-invalid-parentheses', '301'])
    assert.equal(getLesson({ ...problem, source_key }).adapter.id, adapter.id);
  const frames = trace('()())()');
  for (const jump of getLesson(problem).playback.jumpsAfterSpeed)
    assert.ok(frames.some((f) => f.data.action === jump.action));
  const render = (action) =>
    renderToStaticMarkup(
      createElement(Canvas, { data: frames.find((f) => f.data.action === action).data }),
    );
  for (const phrase of [
    'Original character identities',
    'Candidate search workspace',
    'Active call ancestry',
    'Candidate validator',
    'Unique minimal answers',
  ])
    assert.ok(render('delete').includes(phrase));
  assert.ok(render('resume').includes('Resume parent state'));
  assert.ok(render('check-initialize').includes('Validator openings'));
  assert.ok(render('result').includes('Returned answers'));
});
