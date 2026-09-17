import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const scope = process.argv[2];
const suites = readdirSync('tests/frontend')
  .filter((name) => name.endsWith('.test.mjs'))
  .filter((name) =>
    scope === 'atlas'
      ? ['atlas.test.mjs', 'spatial.test.mjs'].includes(name)
      : scope === 'visualizers'
        ? !['atlas.test.mjs', 'spatial.test.mjs'].includes(name)
        : true,
  );
if (!suites.length) throw new Error('No frontend tests discovered.');
const result = spawnSync(
  process.execPath,
  ['--test', ...suites.map((name) => 'tests/frontend/' + name)],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
