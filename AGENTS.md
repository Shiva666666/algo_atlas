# Algo Atlas working agreements

## Start here

Read this file and `docs/ARCHITECTURE.md` before changing code. Consult `PRODUCT.md`
and `DESIGN.md` for product and visual decisions, and `docs/visualizer-conventions.md`
for lesson work. Work in this repository, not an older copy. Preserve uncommitted
changes, especially new lessons. Do not deploy, push, or export private data unless
the user requests it.

## Where changes belong

- `src/app/`: routes, providers, shell, and application composition.
- `src/features/<feature>/`: feature components, queries, hooks, and styles. Export
  cross-feature interfaces through explicit `index.ts` entries.
- `src/shared/`: API client, query keys, contracts, reusable UI and browser hooks.
  Shared modules must not import features, the application shell, or preview data.
- `src/features/visualizers/lessons/<descriptive-name>/`: a lesson's adapter,
  pure trace, types, presets, renderer, optional input editor, reference and styles.
  Register it once in `src/features/visualizers/registry.tsx`; never add a
  problem-specific branch to the main visualizer page or shared playback hook.
- `src/preview/`: explicitly bundled read-only fallback content. This is not the
  user's database, and must not become a write fallback.
- `backend/algo_atlas/api/`: HTTP validation, dependency injection and responses.
- `backend/algo_atlas/services/`: operations and transaction ownership.
- `backend/algo_atlas/persistence/`: SQLAlchemy queries and search-index helpers.
- `backend/algo_atlas/integrations/`: Git, export files and remote metadata.
- `tests/frontend/` and `tests/backend/`: corresponding regression tests.

Use descriptive names, not numbered batches or miscellaneous utility collections.
Share a module when multiple consumers need the same contract, not just similar
looking code. Never create circular dependencies. Keep `config.py`, `models.py`,
historical migrations, and launcher/module entry points compatible.

## Data and completion rules

UI and structure changes must not change saved Python, learning status, mistake
history, exports, or the local database. Use temporary databases and repositories
for write tests. Saved Python is never executed by a visualizer. Do not regenerate
golden fixtures to conceal a behavior change.

Before finishing:

- Run `npm run check`, `npm run build`, and the backend test suite.
- Run `python -m ruff check .` and `python -m ruff format --check .` using the
  project's virtual environment. Use `npm run format` for frontend/document edits.
- Add tests for new behavior and lesson registry wiring, boundaries, immutable
  snapshots, independent answers and reference-code focus.
- Verify affected screens at desktop, mobile and intermediate widths, including
  keyboard and reduced motion. Distinguish actual browser evidence from SSR tests.
- Keep selectors and CSS import order stable for structural changes.
- Update `docs/ARCHITECTURE.md` and this guide in the same change if ownership or
  dependency rules change. Record discovered unrelated bugs separately.

Formatting excludes exports, canonical lesson references, generated files and
bundled third-party tooling. Never bulk-format those assets.

## Prompt for future ChatGPT conversations

> Before proposing or writing code for Algo Atlas, read AGENTS.md and
> docs/ARCHITECTURE.md (and docs/visualizer-conventions.md for lessons). Follow the
> documented ownership and dependency rules. Preserve saved data and existing
> behavior; identify the files and tests you will change. Add lessons through a
> named lesson folder and registry entry, not shared playback branches. If you
> cannot access these files, ask me to attach them rather than inventing structure.

## Algorithm explanations (user preference, 2026-08-31)

For future algorithm visualization work, read `docs/visualizer-conventions.md`.
Use Bklit UI visualization primitives, Kokonut UI interface components, and
Motion for React for restrained hover/press behavior. Reuse the source-adapted
primitives already in `src/shared/ui/LessonPrimitives.tsx` before
adding dependencies. Keep the incumbent Algo Atlas identity.

Correct algorithm meaning takes priority over animation. Trace the documented
reference code with immutable snapshots and code-linked steps; never imply that
arbitrary saved Python has been executed. Keep generic outlines clearly labeled.
Implement and verify a bounded batch of problems before extending the catalog.

Do not change a problem's learning status, saved solution, or local database as a
side effect of UI work. Do not publish private problem data or exports without
the user's request. Follow `PRODUCT.md` and `DESIGN.md` for broader context.
