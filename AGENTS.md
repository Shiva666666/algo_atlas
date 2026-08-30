# Algo Atlas working agreements

## Algorithm explanations (user preference, 2026-08-31)

For future algorithm visualization work, read `docs/visualizer-conventions.md`.
Use Bklit UI visualization primitives, Kokonut UI interface components, and
Motion for React for restrained hover/press behavior. Reuse the source-adapted
primitives already in `src/visualizers/components/LessonPrimitives.tsx` before
adding dependencies. Keep the incumbent Algo Atlas identity.

Correct algorithm meaning takes priority over animation. Trace the documented
reference code with immutable snapshots and code-linked steps; never imply that
arbitrary saved Python has been executed. Keep generic outlines clearly labeled.
Implement and verify a bounded batch of problems before extending the catalog.

Do not change a problem's learning status, saved solution, or local database as a
side effect of UI work. Do not publish private problem data or exports without
the user's request. Follow `PRODUCT.md` and `DESIGN.md` for broader context.
