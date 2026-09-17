# Algo Atlas architecture

This is the placement guide for contributors and generated code. Start with
[AGENTS.md](../AGENTS.md); retain [product](../PRODUCT.md), [design](../DESIGN.md),
and [visualizer](visualizer-conventions.md) guidance. This reorganization changes
ownership, not the database schema, API, trace algorithms or UI contract.

## Frontend ownership

```text
src/
  app/                          Routes, providers, shell, ordered style manifests
  shared/
    api/                        HTTP client, write headers, query keys
    contracts/                  API response and payload types
    ui/                         Cross-feature UI primitives
    hooks/                      Browser/device preferences
    styles/                     Global tokens and foundations
  features/
    atlas/                      2D/3D graph, deterministic layouts, worker
    dashboard/                  Analytics charts and query
    problems/
      library/                  Search, filtering, selection, list
      editor/                   Controller, classification, code, notes, history
    taxonomy/                   Taxonomy query and management
    settings/                   Controller, sync review, Git/storage/preferences
    visualizers/
      core/                     Frame contracts, trace/playback hook, factory
      components/               Shared diagrams, input and explanation controls
      lessons/<lesson-name>/    Independently owned algorithm lessons
      registry.tsx              Identity-to-lesson mapping
      ProblemVisualizerPage.tsx Generic composition; no algorithm branching
  preview/                      Explicitly bundled read-only fallback
```

Application composition imports feature public entries. A feature may import its
own internals, shared modules, and another feature's explicit public `index.ts`.
Features never import the application shell. Shared code has no feature or
preview dependency. `app/App.tsx` installs the preview read fallback on the shared
HTTP client; writes never fall back. Existing cache keys are defined in
`shared/api/keys.ts`; do not change their arrays, cache policies or invalidations
as incidental cleanup.

`useProblemEditor` and `useSettings` own each screen's state and actions. Their
sections render that model; do not duplicate mutations in a section. Query hooks
belong to the feature owning the resource. Keep worker URLs relative to their
module so production bundling remains valid.

Promote code to `shared/` only for genuinely shared behavior with a stable
interface. Presentation common only to lessons belongs in visualizer components.
Core must not depend on specific lessons or renderers. Type-only dependencies may
point back to contracts; runtime cycles are rejected.

## Adding a lesson

Use `lessons/repeated-substring/` as a small complete example and
`lessons/steiner-tree/` for multi-stage playback. Add one descriptive folder:

```text
lessons/my-algorithm/
  types.ts          Input and immutable frame payload
  presets.ts        Named normal and boundary cases
  trace.ts          Parser and deterministic trace generation
  reference.py      Canonical reference (or reference.ts for text constants)
  adapter.ts        Metadata and pure trace binding
  Canvas.tsx        Typed diagram renderer
  InputEditor.tsx   Optional controlled raw/onChange editor
  styles.css        Optional, scoped lesson styles
  index.tsx         Typed defineLesson registration
```

The parser and trace must not depend on React, network, persistence, or saved
Python execution. Copy mutable state into each frame. Keep exact reference text
and honest line-focus mapping. `VisualFrame<D>` and `VisualizerAdapter<I, D>`
carry the payload; `defineLesson<D>` binds it to a matching canvas. The registry
erases that type only at its generic rendering boundary. Do not add `any` casts
in new renderers to evade the contract.

For an adapter and canvas already exported from that folder:

```tsx
import { defineLesson } from '../../core/lesson';
import { myVisualizer } from './adapter';
import { MyCanvas } from './Canvas';
import { MyInputEditor } from './InputEditor';

export const lesson = defineLesson({
  adapter: myVisualizer,
  aliases: ['my-algorithm', 'platform-numeric-key'],
  Canvas: MyCanvas,
  InputEditor: MyInputEditor,
  playback: {
    jumpsAfterSpeed: [{ action: 'comparison', label: 'Next comparison' }],
  },
});
```

Import `lesson` with a descriptive alias in `registry.tsx` and append it to
`lessons`. Use `source` for source-specific identities (for example LintCode 33).
`preservePresentation` retains classic presentation where needed; the default is
diagram-first. Playback metadata supplies stages, transition filtering and action
or phase jumps. No change to the page or playback engine is necessary.

Add a `tests/frontend/<lesson-name>.test.mjs` suite using `load-module.mjs`.
Cover every preset, input boundaries, independent answers, intermediate invariants,
snapshot independence, source focus, identity aliases and semantic rendering. The
unified runner automatically discovers each `.test.mjs` once, including the
trie/unique-split suite. The shared Vite loader disables its WebSocket listener.
Existing golden traces and reference strings live in
`tests/frontend/fixtures/lesson-baseline.json`; intentional behavior changes need
explicit review, not blind snapshot updates.

Saved code remains separate from the simulated reference. Generic fallbacks retain
“Study outline · not execution.” Invalid input keeps the last successfully applied
trace. A lesson addition must not modify saved records or their learning statuses.

## Backend ownership

```text
backend/algo_atlas/
  main.py                 ASGI entry, lifecycle, middleware, router composition
  api/                    HTTP boundaries, validation, response/status mapping
  services/               Business operations and transaction ownership
    sync/
      state.py            Settings keys, lock and sync errors
      records.py          Normalization and local record representation
      catalog.py          Validated incoming catalog representation
      comparison.py       Differences and conflicts
      planning.py         Three-way reconciliation planning
      apply.py            Transactional database application
      __init__.py         Public orchestration and backup/export lifecycle
  persistence/            SQLAlchemy queries and FTS helpers
  integrations/           Git commands, export files, LeetCode metadata
  config.py, models.py     Stable imports used by startup/migrations
  db.py                   Engine/session creation, database initialization
  bootstrap.py            Existing first-run and reconciliation CLI
  launcher.py              Existing launch/stale-build support
```

Routers import services, schemas and session dependencies, not integrations or
persistence directly. Services may use persistence and integrations but must not
import FastAPI or routers. Persistence and integrations never depend on services,
routers or application startup. Use SQLAlchemy directly; no generic repository
framework. `ServiceError` is mapped centrally to the existing HTTP detail/status.

### Adding an endpoint

Follow the existing `GET /api/problems/{problem_id}` chain:

1. Add the HTTP contract and dependency-injected handler in `api/problems.py`
   (or a descriptively named router). Keep validation in schemas/HTTP boundaries.
2. Put the operation in `services/problems.py`, accepting an explicit session.
   Raise `ServiceError` for the expected domain error. Preserve transaction
   ownership: persistence helpers must not unexpectedly commit.
3. Put reusable SQL/query-loading work in `persistence/problems.py`. A changed
   problem must update the FTS index within the same operation/transaction.
4. Put external file/network/process work in `integrations/` and expose a public
   function, rather than reaching into another layer's private helpers.
5. Register a new router in `main.py` if needed. Add temporary-database API tests
   and explicitly review the OpenAPI fixture for an intentional API change.

For example a detail handler stays thin:

```python
@router.get("/api/problems/{problem_id}")
def get_problem(problem_id: str, session: Session = Depends(get_session)) -> dict:
    return operations.get_problem(problem_id=problem_id, session=session)
```

Do not change historical migration imports, export schema, stored hashes,
backup/locking behavior, reconciliation conflict handling or export-only Git
publishing during structural work. Export parsing/validation belongs to the
public integration interface; database application belongs to the sync service.

## Styles and stable entry points

Application CSS files in `app/styles/` are ordered manifests. Shared styles remain
independent of features. Feature and lesson styles retain their
original position in that import order: moving a rule to the end can change the
cascade even if selectors are identical. Keep selectors, specificity, responsive
breakpoints, focus, keyboard behavior and reduced-motion semantics unchanged.
Prefer scoped feature classes for new styles. Never auto-format canonical
algorithm references, exported records, generated bundles or vendor tooling.

`src/main.tsx`, the ASGI application, `python -m algo_atlas.bootstrap`, launcher
module, Windows `.cmd`/PowerShell launchers and macOS `.command` scripts remain
entry points. Old internal source paths are not public compatibility interfaces.
SQLite remains local; export restore/reconciliation behavior is unchanged.

## Verification

With development dependencies installed and the virtual environment active:

```text
npm run check
npm run build
python -m pytest
python -m ruff check .
python -m ruff format --check .
```

`npm run test:atlas` and `npm run test:visualizers` remain available. Formatting:
`npm run format` and `python -m ruff format .`. `check:architecture` uses the
TypeScript compiler API and Python AST to reject forbidden dependencies/cycles.
Registry tests reject duplicate aliases and missing renderers. CI runs these
checks, build, backend/frontend tests and fresh-database restoration on Windows
and macOS; it also validates macOS launcher syntax and Git executable modes.

Tests with writes must use temporary databases/repositories, never `.local` user
data. Inspect affected pages at desktop, intermediate and mobile widths and test
input rebuild, playback, keyboard controls, saved-code separation and reduced
motion. SSR/trace tests do not replace browser checks. Keep reports precise about
what was actually exercised and which OS was used.

Update this guide and AGENTS.md in the same change whenever structure or ownership
changes. For a reusable ChatGPT prompt, see the root guide.
