# Structural refactor verification

## Preserved contracts

- Routes: `/`, `/dashboard`, `/library`, `/problems/new`, `/problems/:problemId`,
  `/problems/:problemId/visualize`, `/taxonomy`, `/settings`, and `/sync` redirect.
- API: `tests/backend/fixtures/openapi.json` captures the pre-refactor paths,
  methods, validation schemas, defaults and response contracts.
- Lessons: `tests/frontend/fixtures/lesson-baseline.json` captures 39 routing
  identities and 171 preset runs, including exact reference text, trace hashes,
  and first/middle/final diagram markup hashes. Aliases intentionally exercise
  some lessons more than once. There are 27 specialized registrations plus the
  generic fallback, each in a descriptive folder.
- Cache keys: unchanged arrays in `src/shared/api/keys.ts`; defaults remain
  15-second stale time, one retry, and no refetch on window focus.
- Device preference: `algo-atlas-reduced-motion` keeps its name and meaning.
- Launch commands, local SQLite location, migrations, export format, startup
  reconciliation and export-only Git publication retain their existing behavior.
- Source formatting uses LF on both platforms, including raw Python references.
  Windows launcher CRLF and macOS executable/LF rules remain in place.

## Local verification

Performed on Windows using the repository virtual environment and installed Node:

- Production build, TypeScript checks, frontend/Python dependency boundaries,
  runtime-cycle checks, Prettier and Ruff checks.
- Unified frontend suite: 59 passing tests; one optional live-server check skipped.
  Includes exact legacy preset/markup parity, registry completeness, independent
  answer oracles, immutable snapshots, HTTP fallback/headers, playback filtering,
  action jumps, layout/worker contracts, and negative architecture fixtures.
- Backend suite: 41 passing tests, including API/OpenAPI parity, CRUD/FTS,
  deterministic exports, invalid exports, sync conflicts, backups, safe Git
  publication, and real Alembic migration plus restoration into a temporary DB.
- macOS launcher `bash -n` checks using Git Bash; both launchers retain executable
  Git mode `100755`. This is not a native macOS launch test.

Browser checks used headless Edge, production assets, read-only preview fixtures
and an isolated browser profile. No live record or Git writes were made:

- Before/after screenshots: library, dashboard, Maximal Square editor, Steiner
  lesson, Generate Parentheses lesson and settings at 1440, 720 and 390 pixels.
  Fifteen of eighteen images were pixel-identical; dashboard differences were
  below 0.03% of pixels with no visible layout change on inspection. Screenshot
  evidence is local-only in `.local/refactor-baseline/screenshots/`.
- Next/previous/restart/play/pause, keyboard timeline controls, preset changes,
  invalid-input retention, Steiner stage tabs and transition filtering, narrow
  viewport controls, system and device-local reduced-motion preference.
- Editor title save, preservation of solution text, detail query invalidation,
  and Git-settings save/refresh with all write requests intercepted in memory.
- No page errors during these browser checks.

The Windows/macOS CI matrix now runs build, all frontend/backend tests, formatting,
architecture checks and fresh-clone restoration. Native macOS execution and the
new remote CI run have not been observed locally. This evidence is not a full
accessibility audit, native 200% zoom check, or exhaustive UI interaction test.

## Existing issues left outside this refactor

- Large chart/3D production chunks still produce a build-size warning.
- The current Python environment reports Starlette test-client and Alembic config
  deprecation warnings; dependencies and historical migrations were not redesigned.
- The minimum-vertices renderer checks an optional edge-phase marker that its
  existing trace does not emit. That explanatory label behavior is preserved;
  correcting it requires a separately reviewed behavior change.
- The four formerly grouped graph/backtracking/interval lessons retain their
  original JSON input validation behavior. Stronger input bounds would be a
  functional change and are not silently introduced by this reorganization.

No database schema, exported record, saved solution, learning status, runtime
dependency, or hosted deployment was changed as part of this refactor.
