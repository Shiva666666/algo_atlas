---
slug: "src-pages-problemvisualizerpage-tsx"
primary_target: "src/pages/ProblemVisualizerPage.tsx"
related_targets: ["src/visualizers/lesson.css", "src/visualizers/components/LessonPrimitives.tsx", "src/visualizers/components/PracticeCanvas.tsx"]
---

# Algorithm visual explanations

Mode: Read, with explicit playback controls.

This is an extension of the incumbent Algo Atlas interface, not a replacement
visual identity. Preserve root PRODUCT.md and DESIGN.md. The user's 2026-08-31
direction is clearer, truthful 2D algorithm visuals using Bklit UI, Kokonut UI,
and Motion for React. Finish bounded batches before expanding the catalog.

## Direction contract

The first viewport establishes the problem, a compact editable test case, and
manual playback before the diagram. The diagram gets more width than the
reference-code panel; both must explain the same immutable state snapshot.
On narrow screens the explanation panel follows the diagram.

The signature interaction is code-linked stepping: one operation updates the
diagram, its plain-language explanation, and accessible code-line markers.
No animation interpolates algorithm values or invents intermediate states.
Small hover/press feedback and the measured tab indicator use Motion; respect
the system and saved reduced-motion preferences.

## First batch

- N-Queens: board, candidate attacks, occupied sets, undo, and copied solutions.
- Coin Change II: recursive take/skip calls and a memo table of collected sums.
- Hexadecimal: signed input, unsigned 32-bit word, nibble lookup, prepend, shift.
- Incremovable Subarrays I: corrected comparison timing and O(n) boundary counts.

## Verification boundary

Algorithm/oracle tests, server-side render smoke tests, TypeScript/production
build, backend tests, and local HTTP route/code-reference checks passed.
The finish review resolved four source-level accessibility/craft findings.
Desktop/mobile rendered visual verification was not performed: the Sites
workflow requires explicit browser-testing opt-in, requested but not received.
No deployment or data export was performed.

See docs/visualizer-conventions.md for the maintained implementation contract.
