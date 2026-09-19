import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
});
after(() => server.close());
const paths = [
  'keys-and-rooms',
  'complete-components',
  'nearest-exit',
  'farmland',
  'maximum-fish',
  'find-city',
  'minimum-time-room',
];
const modules = Object.assign(
  {},
  ...(await Promise.all(
    paths.map((name) =>
      server.ssrLoadModule(`/src/features/visualizers/lessons/${name}/adapter.ts`),
    ),
  )),
);
const registry = await server.ssrLoadModule('/src/features/visualizers/registry.tsx');

function assertCodeLinks(frames, code) {
  for (const frame of frames) {
    assert.equal(frame.codeFocus.length, 1);
    assert.equal(code.split('\n')[frame.codeLines[0] - 1].trim(), frame.codeFocus[0]);
  }
}
function reachability(rooms) {
  const seen = new Set([0]),
    stack = [0];
  while (stack.length)
    for (const next of rooms[stack.pop()])
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
  return seen.size === rooms.length;
}
function completeOracle(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i),
    edgeCount = Array(n).fill(0);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const [u, v] of edges) {
    const a = find(u),
      b = find(v);
    if (a !== b) parent[b] = a;
  }
  const size = Array(n).fill(0);
  for (let i = 0; i < n; i++) size[find(i)]++;
  for (const [u] of edges) edgeCount[find(u)]++;
  return [...new Set(Array.from({ length: n }, (_, i) => find(i)))].filter(
    (root) => edgeCount[root] === (size[root] * (size[root] - 1)) / 2,
  ).length;
}
function nearestOracle(maze, entrance) {
  const queue = [[...entrance, 0]],
    seen = new Set([entrance.join(',')]);
  for (let h = 0; h < queue.length; h++) {
    const [r, c, d] = queue[h];
    if (d > 0 && (r === 0 || c === 0 || r === maze.length - 1 || c === maze[0].length - 1))
      return d;
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nr = r + dr,
        nc = c + dc,
        k = `${nr},${nc}`;
      if (maze[nr]?.[nc] === '.' && !seen.has(k)) {
        seen.add(k);
        queue.push([nr, nc, d + 1]);
      }
    }
  }
  return -1;
}
function farmlandOracle(land) {
  const result = [];
  for (let r = 0; r < land.length; r++)
    for (let c = 0; c < land[0].length; c++)
      if (
        land[r][c] === 1 &&
        (r === 0 || land[r - 1][c] === 0) &&
        (c === 0 || land[r][c - 1] === 0)
      ) {
        let rr = r,
          cc = c;
        while (rr + 1 < land.length && land[rr + 1][c] === 1) rr++;
        while (cc + 1 < land[0].length && land[r][cc + 1] === 1) cc++;
        result.push([r, c, rr, cc]);
      }
  return result;
}
function fishOracle(grid) {
  const seen = new Set();
  let best = 0;
  for (let sr = 0; sr < grid.length; sr++)
    for (let sc = 0; sc < grid[0].length; sc++) {
      if (!grid[sr][sc] || seen.has(`${sr},${sc}`)) continue;
      let total = 0,
        stack = [[sr, sc]];
      seen.add(`${sr},${sc}`);
      while (stack.length) {
        const [r, c] = stack.pop();
        total += grid[r][c];
        for (const [dr, dc] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nr = r + dr,
            nc = c + dc,
            k = `${nr},${nc}`;
          if (grid[nr]?.[nc] > 0 && !seen.has(k)) {
            seen.add(k);
            stack.push([nr, nc]);
          }
        }
      }
      best = Math.max(best, total);
    }
  return best;
}
function dijkstraCity(n, edges, threshold) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  let answer = -1,
    fewest = Infinity;
  for (let source = 0; source < n; source++) {
    const distance = Array(n).fill(Infinity);
    distance[source] = 0;
    const heap = [[0, source]];
    while (heap.length) {
      heap.sort((a, b) => a[0] - b[0]);
      const [d, u] = heap.shift();
      if (d !== distance[u]) continue;
      for (const [v, w] of adj[u])
        if (d + w < distance[v]) {
          distance[v] = d + w;
          heap.push([d + w, v]);
        }
    }
    const count = distance.filter((d, i) => i !== source && d <= threshold).length;
    if (count <= fewest) {
      fewest = count;
      answer = source;
    }
  }
  return answer;
}
function timedOracle(moveTime) {
  const rows = moveTime.length,
    cols = moveTime[0].length,
    best = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  best[0][0] = 0;
  const heap = [[0, 0, 0]];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
    const [t, r, c] = heap.shift();
    if (t !== best[r][c]) continue;
    if (r === rows - 1 && c === cols - 1) return t;
    const duration = (r + c) % 2 === 0 ? 1 : 2;
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nr = r + dr,
        nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const arrival = Math.max(t, moveTime[nr][nc]) + duration;
      if (arrival < best[nr][nc]) {
        best[nr][nc] = arrival;
        heap.push([arrival, nr, nc]);
      }
    }
  }
  return -1;
}

test('graph traversal lessons agree with independent reachability and DSU oracles', () => {
  for (const preset of modules.keysRoomsVisualizer.presets) {
    const input = JSON.parse(preset.input),
      frames = modules.createKeysRoomsFrames(input);
    assert.equal(frames.at(-1).data.result, reachability(input.rooms));
    assertCodeLinks(frames, modules.keysRoomsCode);
  }
  for (const preset of modules.completeComponentsVisualizer.presets) {
    const input = JSON.parse(preset.input),
      frames = modules.createCompleteComponentsFrames(input);
    assert.equal(frames.at(-1).data.result, completeOracle(input.n, input.edges));
    assertCodeLinks(frames, modules.completeComponentsCode);
  }
  const isolated = modules.createCompleteComponentsFrames({ n: 10, edges: [] });
  for (const node of isolated[0].data.graph.nodes) {
    assert.ok(node.x >= 23 && node.x <= 617, `node ${node.id} x stays inside the SVG`);
    assert.ok(node.y >= 40 && node.y <= 327, `node ${node.id} y stays inside the SVG`);
  }
});
test('grid traversal lessons cover exits, rectangles, and weighted components', () => {
  for (const preset of modules.nearestExitVisualizer.presets) {
    const input = JSON.parse(preset.input),
      frames = modules.createNearestExitFrames(input);
    assert.equal(frames.at(-1).data.result, nearestOracle(input.maze, input.entrance));
    assertCodeLinks(frames, modules.nearestExitCode);
  }
  for (const preset of modules.farmlandVisualizer.presets) {
    const input = JSON.parse(preset.input),
      frames = modules.createFarmlandFrames(input);
    assert.deepEqual(frames.at(-1).data.result, farmlandOracle(input.land));
    assertCodeLinks(frames, modules.farmlandCode);
  }
  for (const preset of modules.maximumFishVisualizer.presets) {
    const input = JSON.parse(preset.input),
      before = JSON.stringify(input),
      frames = modules.createMaximumFishFrames(input);
    assert.equal(frames.at(-1).data.result, fishOracle(input.grid));
    assert.equal(JSON.stringify(input), before);
    assertCodeLinks(frames, modules.maximumFishCode);
  }
});
test('shortest path lessons agree with independent Dijkstra searches', () => {
  for (const preset of modules.findCityVisualizer.presets) {
    const input = JSON.parse(preset.input),
      frames = modules.createFindCityFrames(input);
    assert.equal(
      frames.at(-1).data.answer,
      dijkstraCity(input.n, input.edges, input.distanceThreshold),
    );
    assertCodeLinks(frames, modules.findCityCode);
  }
  for (const preset of modules.minimumTimeVisualizer.presets) {
    const input = JSON.parse(preset.input),
      frames = modules.createMinimumTimeFrames(input);
    assert.equal(frames.at(-1).data.result, timedOracle(input.moveTime));
    assertCodeLinks(frames, modules.minimumTimeCode);
  }
});
test('checkpoint frames teach submitted mistakes without fabricating algorithm state', () => {
  assert.ok(
    modules.createKeysRoomsFrames({ rooms: [[1], []] }).every((frame) => !frame.mistakeCheckpoint),
  );
  assert.ok(
    modules
      .createNearestExitFrames({
        maze: [
          ['+', '.', '+'],
          ['+', '.', '+'],
        ],
        entrance: [1, 1],
      })
      .every((frame) => !frame.mistakeCheckpoint),
  );
  const farmland = modules.createFarmlandFrames({ land: [[0, 1, 1, 1, 0]] });
  assert.ok(farmland.some((frame) => frame.mistakeCheckpoint?.submitted === 'seen.add(node)'));
  assert.deepEqual(farmland.at(-1).data.result, [[0, 1, 0, 3]]);
  const timed = modules.createMinimumTimeFrames({
    moveTime: [
      [9, 0],
      [0, 10],
    ],
  });
  assert.equal(timed[0].data.best[0][0], 0);
  assert.ok(timed.filter((frame) => frame.mistakeCheckpoint).length >= 3);
});
test('strict limits, immutable frames, and all numeric/slug registry aliases', () => {
  assert.throws(() => modules.parseFindCityInput('{"n":8,"edges":[],"distanceThreshold":1}'));
  assert.throws(() => modules.parseFarmlandInput('{"land":[[1,0],[1,1]]}'));
  assert.throws(() =>
    modules.parseMinimumTimeInput(
      JSON.stringify({ moveTime: Array.from({ length: 9 }, () => [0]) }),
    ),
  );
  const frames = modules.createKeysRoomsFrames({ rooms: [[1], []] });
  frames[0].data.seen.push(99);
  assert.ok(!frames[1].data.seen.includes(99));
  const identities = [
    ['841', 'keys-and-rooms'],
    ['2685', 'count-the-number-of-complete-components'],
    ['1926', 'nearest-exit-from-entrance-in-maze'],
    ['1992', 'find-all-groups-of-farmland'],
    ['2658', 'maximum-number-of-fish-in-a-grid'],
    ['1334', 'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance'],
    ['3342', 'minimum-time-to-reach-last-room-ii'],
  ];
  for (const [numeric, slug] of identities) {
    assert.notEqual(
      registry.getVisualizer({ source: 'leetcode', source_key: numeric }).mode,
      'generic',
    );
    assert.notEqual(
      registry.getVisualizer({ source: 'leetcode', source_key: slug }).mode,
      'generic',
    );
  }
});
