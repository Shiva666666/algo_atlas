# Algorithm visualizer conventions

These conventions govern algorithm explanation surfaces, not the global design
system. Follow PRODUCT.md and DESIGN.md; preserve Algo Atlas's graphite,
cyan/violet identity, IBM Plex Sans interface text, and DM Mono code/measurements.
The user requested these library and correctness preferences on 2026-08-31.

## Shared interface

Reuse `src/visualizers/components/LessonPrimitives.tsx` before adding dependencies:

- `StateLegend` adapts Bklit UI's Legend primitives. Symbols and labels identify
  states; hovering emphasizes the key without filtering algorithm data.
- `SmoothTabs` adapts Kokonut UI's measured active-tab background. Preserve native
  tab semantics, Arrow/Home/End navigation, selected state, and visible focus.
- `LessonMotion` and `LessonButton` use the installed `motion/react` dependency.
  Buttons have a restrained 1px hover lift and 0.98 press scale. System or saved
  device-local reduced-motion preference disables these transforms and makes the
  tab indicator immediate. CSS also disables lesson transitions for system
  reduced motion.
- Keep source attribution in THIRD_PARTY_NOTICES.md. These are source adaptations,
  not full Bklit UI or Kokonut UI installations.

Present compact input controls, playback and the current operation, a 2D diagram,
and Python code/Steps. Preserve 44px control targets, visible cyan focus, readable
labels, and keyboard-accessible scroll regions. Editing input pauses playback;
a notice identifies the old input still shown until Build steps applies the edit.

## Layout

Use `src/visualizers/lesson.css` as the surface authority.

- Desktop: diagram and explanation occupy distinct columns; controls wrap.
- At 1200px and below: narrow the explanation column and stack the queen board
  above its attack sets.
- At 980px and below: explanation follows the diagram; the wider diagram can
  place the queen board beside its sets again.
- At 560px and below: inputs, queen workspace, and hexadecimal operations stack;
  playback wraps and the step count has its own row.
- At 1600px and above: all eight hexadecimal nibbles appear on one row.
  Otherwise use four columns without changing bit order.
- Large tables and code scroll locally; memo row headings remain visible.

## Algorithm meaning

Correctness takes priority over animation. Validate the input domain, produce a
complete bounded trace, and copy all changing arrays, objects, stacks, sets, and
results into independent snapshots. Do not silently truncate searches or
interpolate states that never occur.

The first code-linked batch establishes these requirements:

- N-Queens: n = 1–5. Distinguish testing, rejection, placement, recursion, undo,
  and copied solutions. Separate the working board from saved boards.
- Coin Change II: amount = 0–12; 1–5 unique coins in original order, each 1–99.
  `a` is collected sum. Explore take before skip; cache only after both return.
  Distinguish uncached `—`, computed zero, base cases, and completed results.
- Hexadecimal: signed 32-bit input. Separate original input from the unsigned
  working word; show mask, nibble lookup, prepend, and shift. Zero returns early.
- Incremovable subarrays: 1–18 positive safe integers. Show comparisons before
  pointer movement, retain the last valid suffix while testing extension, and
  count only non-empty removal intervals.

Use semantic HTML: native tables with captions and scoped headers, ordered call
stacks, definition lists, labeled board images, and visible bit/range labels.
State needs text or symbols in addition to color.

## Reference-code contract

New code-linked adapters provide `referenceCode`, per-frame `codeFocus`, clear
input guidance, and diagnostic presets. Focus snippets must exist in the
reference. Group logical operations honestly: several visual steps may correspond
to one source line. Programmatically expose current code lines and their numbers.

Never imply arbitrary saved Python was executed. Display the reference explicitly;
when saved text differs, preserve access to it and state that edits are not
simulated. Text matching is not semantic verification. Generic fallbacks remain
labeled "Study outline · not execution."

Register the implemented problem/source identity, including LintCode's numeric
key for N-Queens. Extend and verify a bounded batch before expanding the catalog.
UI work must not modify learning status, saved solutions, or the local database,
or publish private data.

## Validation and evidence

Run:

```text
npm run test:visualizers
npm run build
.\.venv\Scripts\python.exe -m pytest
```

Extend tests with independent answer oracles, intermediate-state invariants,
snapshot independence, invalid/boundary inputs, reference-focus coverage,
registry selection, and semantic render smoke checks.

Recorded check, 2026-08-31: 10 visualizer tests, production build, and 21 backend
tests passed. The source review's four findings were resolved. Local HTTP checks
confirmed all four records select the right adapter and match its reference code.
These are not browser evidence: desktop/mobile rendering, keyboard interaction,
zoom, overflow, and reduced-motion behavior still need authorized browser checks.
Do not claim screenshot or visual QA until it occurs.
