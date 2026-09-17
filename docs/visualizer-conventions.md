# Algorithm visualizer conventions

These conventions govern algorithm explanation surfaces, not the global design
system. Follow PRODUCT.md and DESIGN.md; preserve Algo Atlas's graphite,
cyan/violet identity, IBM Plex Sans interface text, and DM Mono code/measurements.
The user requested these library and correctness preferences on 2026-08-31.

## Shared interface

Reuse `src/shared/ui/LessonPrimitives.tsx` before adding dependencies:

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

## Reusable diagram foundations

Presentation-only primitives keep algorithm logic in adapters and make later
lessons consistent:

- `SequenceStrip` is the indexed array/string view for pointers, ranges,
  retained/removed segments, and selectable intervals.
- `RecursionWorkbench` is the call-stack view for active calls, candidates,
  chosen paths, returns, undo, and separately recorded outputs.
- `DependencyGrid` is the matrix/DP view for initialized versus unvisited cells,
  explicit top/left/diagonal (or recurrence) dependencies, and result state.
- `TrieTree` is the stable-prefix view for character edges, terminal words,
  traversal focus, and capped suggestion results.

Batch 1 uses these contracts through the typed `SequenceStrip`, trie, recursion,
and grid frame payloads. New adapters must emit immutable snapshots and retain
the reference-code focus mapping; saved user code remains reference-only.

## Layout

Use `src/features/visualizers/lesson.css` as the surface authority.

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

## Remove K Digits lesson

- Keep `src/features/visualizers/lessons/remove-k-digits/reference.py` as the canonical raw Python
  reference; derive displayed code and exact line focus from this same source.
- Accept a string of 1–32 ASCII digits, with no leading zeros except `"0"`, and
  integer `k` from 1 through its length. Never convert the whole number to numeric form.
- The stack stores original indexes: show `index → num[index]`, with the top on
  the right. Equal digits fail strict `>`; after budget exhaustion the stack may descend.
- Emit pop and `k-=1` separately; `pendingSpend` explains the intervening state.
  Evaluate scan terms in order: stack, top > current, k; tail terms: k, stack.
  Display short-circuited terms as “not evaluated,” never false.
- Preserve scan → tail cleanup → build → trim order, including `res = ""` before
  tail cleanup. The remove-all guard skips all four phases and returns `"0"`.
  Zero trimming moves a pointer in `res`; it changes neither stack nor budget.
- Reuse `StateLegend`, `SmoothTabs`, and the shared reduced-motion preference with
  Motion for React. Allow grid children to shrink and legends to wrap; digit strips
  scroll locally. This refinement resolved mobile min-content overflow.
- `POST /api/problems` accepts optional `record_initial_mistake` (default `true`);
  use `false` for solved-only additions without a mistake event. No migration is required.
- Recorded handoff, 2026-09-07: reviewer verdict “ship” from seven desktop/mobile/reflow
  screenshots; 20 visualizer tests, 23 backend tests, and the production build passed.
  Browser checks covered custom input, invalid input preserving the previous trace,
  playback, keyboard, saved-code matching, reduced motion, CSS 200% zoom and 720px
  reflow. These checks do not establish a full WCAG audit or native browser zoom coverage.

## Repeated Substring Pattern and Max Area of Island lessons

- `src/features/visualizers/lessons/repeated-substring/` and
  `src/features/visualizers/lessons/max-area-island/` each own a canonical
  `reference.py` and pure `trace.ts`.
  Keep immutable snapshots and exact `codeFocus`/`codeLines` tied to those sources.
- Repeated Substring Pattern tests prefix lengths that divide the string length,
  then tiles the prefix; it does not use KMP. Marked equality positions explain
  the string comparison and must not imply an extra loop in the Python reference.
  String/JSON input accepts 1–32 lowercase ASCII letters.
- Max Area of Island follows recursive DFS in right/down/left/up order. Water
  returns zero without entering `seen`; mark land before recursion and keep the
  input grid immutable. Distinguish each call's subtotal from the seen-cell count;
  update the global maximum only after the root call returns. Grid/JSON input
  accepts rectangular numeric binary grids of 1–10 rows and 1–13 columns.
- Each lesson’s `Canvas.tsx`, shared `StructuredInputEditor.tsx`, and
  `components/styles/sequence-and-grid.css` extend
  the incumbent lesson surface with `StateLegend`, `SmoothTabs`, `LessonMotion`,
  and `LessonButton`, including shared reduced motion. Keep functional annotations
  at least 12px, local scrolling scoped, and mobile content stacked. Invalid
  rebuilds preserve the previous applied trace. Registry selection supports slugs
  and LeetCode keys 459/695 through the existing routes.
- Approved records are Resolved with screenshot code and notes, zero mistake
  events, and `record_initial_mistake: false`; this handoff does not export or publish.
- Recorded handoff, 2026-09-13: 25 visualizer tests, 37 backend tests, and build
  passed; independent periodicity and BFS oracles checked results. Browser checks
  covered 1440px desktop, 390px mobile, 720px reflow, inputs, playback, keyboard,
  trace preservation, code matching, and system/saved reduced motion. Nine viewport
  screenshots are in `.impeccable/review/two-lessons`. Independent review's F1
  (annotations below 12px) was fixed; final verdict review found F1 resolved with
  no resulting wrapping/overflow regression. Native 200% browser zoom remains
  unverified; this evidence does not establish a full accessibility audit.
