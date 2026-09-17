import assert from 'node:assert/strict';
import { test } from 'node:test';
import { server, load } from './load-module.mjs';

const { api, writeApi, configureReadFallback } = await server.ssrLoadModule(
  '/src/shared/api/client.ts',
);
const { selectFrames, nextJump, buildTrace } = await load('core/lesson.tsx');

test('HTTP client preserves live responses, read-only fallback, write headers and errors', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  configureReadFallback((path) => {
    calls++;
    return path === '/api/fixture' ? { offline: true } : undefined;
  });
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ live: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    assert.deepEqual(await api('/api/fixture'), { live: true });
    assert.equal(calls, 0);
    globalThis.fetch = async () => {
      throw new Error('unavailable');
    };
    assert.deepEqual(await api('/api/fixture'), { offline: true });
    await assert.rejects(api('/api/unknown'), /unavailable/);
    const before = calls;
    await assert.rejects(writeApi('/api/fixture', 'PATCH', { title: 'Changed' }), /unavailable/);
    assert.equal(calls, before, 'writes never read fallback data');
    globalThis.fetch = async (path, init) => {
      assert.equal(path, '/api/fixture');
      assert.equal(init.method, 'POST');
      assert.deepEqual(init.headers, { 'Content-Type': 'application/json', 'X-Algo-Atlas': '1' });
      assert.deepEqual(JSON.parse(init.body), { title: 'Changed' });
      return new Response(JSON.stringify({ detail: 'Review required' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    await assert.rejects(writeApi('/api/fixture', 'POST', { title: 'Changed' }), /Review required/);
  } finally {
    globalThis.fetch = original;
    configureReadFallback(() => undefined);
  }
});

test('Playback metadata selects stages and transitions and jumps without altering trace order', () => {
  const frames = [
    { phase: 'scan', data: { stage: 'first', action: 'visit' } },
    { phase: 'scan', traceRole: 'transition', data: { stage: 'first', action: 'compare' } },
    { phase: 'scan', data: { stage: 'first', action: 'compare' } },
    { phase: 'result', data: { stage: 'second', action: 'answer' } },
  ];
  const original = JSON.stringify(frames);
  const options = { stages: [{ id: 'first' }, { id: 'second' }], hideTransitions: true };
  assert.deepEqual(selectFrames(frames, options, 'first', false), [frames[0], frames[2]]);
  assert.deepEqual(selectFrames(frames, options, 'first', true), frames.slice(0, 3));
  assert.deepEqual(selectFrames(frames, options, 'second', false), [frames[3]]);
  assert.equal(selectFrames(frames, undefined, '', false), frames);
  assert.equal(nextJump(frames, 0, { action: 'compare' }), 1);
  assert.equal(nextJump(frames, 0, { nextPhase: true }), 3);
  assert.equal(nextJump(frames, 3, { nextPhase: true }), -1);
  assert.equal(JSON.stringify(frames), original);
  assert.throws(
    () => buildTrace({ parseInput: JSON.parse, createFrames: () => [] }, {}, '{}'),
    /did not create any steps/,
  );
  assert.throws(() => buildTrace({ parseInput: JSON.parse, createFrames: () => frames }, {}, '{'));
});
