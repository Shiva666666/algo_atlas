import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from './load-module.mjs';
const { getLesson, lessons } = await load('registry.tsx');
const baseline = JSON.parse(
  await readFile(new URL('./fixtures/lesson-baseline.json', import.meta.url), 'utf8'),
);
const hash = (value) =>
  createHash('sha256')
    .update(typeof value === 'string' ? value : JSON.stringify(value))
    .digest('hex');
test('All existing identities, reference text, preset traces and representative diagrams stay identical', () => {
  for (const record of baseline) {
    const problem = {
      id: 'fixture',
      source: record.source,
      source_key: record.source_key,
      title: 'Fixture',
      primary_main: { slug: 'arrays-strings', name: 'Arrays' },
      primary_subtag: { slug: 'arrays', name: 'Arrays' },
      taxonomy: [],
      notes: { approach: ['Inspect the state.'] },
      python_code: '',
    };
    const lesson = getLesson(problem),
      adapter = lesson.adapter;
    assert.equal(adapter.id, record.id);
    assert.equal(adapter.presentation ?? null, record.presentation);
    assert.equal(adapter.referenceCode ?? null, record.referenceCode);
    assert.deepEqual(
      adapter.presets,
      record.presets.map(({ count, traceHash, markupHash, ...p }) => p),
    );
    for (const expected of record.presets) {
      const frames = adapter.createFrames(adapter.parseInput(expected.input), problem);
      assert.equal(frames.length, expected.count, record.id);
      assert.equal(hash(frames), expected.traceHash, `${record.id}: ${expected.label}`);
      const markup = [0, Math.floor(frames.length / 2), frames.length - 1].map((i) =>
        renderToStaticMarkup(
          React.createElement(lesson.Canvas, { frame: frames[i], problem }),
        ).replace(/id="[^"]*«[^"]*"/g, 'id="react-id"'),
      );
      assert.equal(hash(markup), expected.markupHash, `${record.id}: ${expected.label} markup`);
    }
  }
});
test('Every lesson is registered once with a renderer and runnable presets', () => {
  const keys = new Set();
  for (const lesson of lessons) {
    assert.ok(lesson.aliases.length);
    assert.equal(typeof lesson.Canvas, 'function');
    assert.ok(lesson.adapter.presets.length);
    for (const alias of lesson.aliases) {
      const key = (lesson.source ?? '*') + ':' + alias;
      assert.ok(!keys.has(key));
      keys.add(key);
    }
  }
});

test('Every named lesson folder has exactly one registered definition', async () => {
  const folders = await readdir(
    new URL('../../src/features/visualizers/lessons/', import.meta.url),
    { withFileTypes: true },
  );
  const registered = new Set();
  for (const folder of folders.filter((entry) => entry.isDirectory() && entry.name !== 'generic')) {
    const { lesson } = await load(`lessons/${folder.name}/index.tsx`);
    assert.ok(lessons.includes(lesson), `${folder.name} must be registered`);
    assert.ok(!registered.has(lesson));
    registered.add(lesson);
  }
  assert.equal(registered.size, lessons.length);
});
