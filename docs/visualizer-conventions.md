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

## Graph and grid traversal lesson family

The graph lesson family uses presentation-only primitives from
`components/TraversalPrimitives.tsx`; algorithms and snapshots stay inside each
named lesson folder.

- `GraphTraversalWorkbench` shows stable node identity, directed or undirected
  edges, inspected connections, and component/algorithm state.
- `GridTraversalBoard` shows walls, numeric cells, frontiers, visited state,
  bounds, paths, and room gates without changing the input model.
- `FrontierLedger` presents a queue, DFS stack, or min-heap with stable item
  identity and explicit discovered-versus-processed state.
- `DistanceMatrix` exposes initialized infinity, active `i -> k -> j`
  dependencies, old/candidate/new distances, and threshold membership.
- `MistakeCheckpoint` is an optional typed frame annotation. It quotes the saved
  expression, states the violated invariant, and gives the correction without
  inventing execution states.

The diagram-first workspace keeps presets and playback visible, collapses custom
input initially, and keeps the code/steps inspector closed. Opening the inspector
must preserve the current frame. Mobile uses the existing accessible drawer and
44px controls. State is expressed with text as well as color; functional labels
remain at least 12px.

The implemented bounded contracts are: graph lessons 1–12 vertices depending on
the lesson, maze/farmland grids at most 8×10, fish grids at most 10×10, Floyd
graphs at most 7 vertices, and room-time grids at most 8×8. Complete traces are
never truncated. Each lesson owns a canonical `reference.py`, typed immutable
trace, diagnostic presets, renderer, editor, and numeric/slug registry aliases.

State coverage is part of the reusable contract, not lesson-specific decoration:

- Directed reachability shows discovery, queue order, key inspection, processing,
  and the final reachable/locked result. Complete Components separates component
  collection from degree auditing and accepted/rejected verdicts; the 10 isolated
  node boundary keeps every singleton visible and counts all ten as complete.
- Grid lessons distinguish frontier, candidate, active, visited, rejected, path,
  rectangle-bound, subtotal, and completed-result states as applicable. Minimum
  Time also separates heap pop, stale-entry rejection, wait, alternating movement
  duration, relaxation, and destination finalization.
- Find the City preserves initialized infinity, direct-edge and diagonal setup,
  active Floyd `i -> k -> j` dependencies, relaxation, threshold counts, and the
  largest-index tie break. These states must remain readable in text and tables
  even when color is unavailable.

Recorded handoff, 2026-09-19: Keys and Rooms (841), Nearest Exit (1926),
Farmland (1992), Maximum Fish (2658), Find the City (1334), and Minimum Time II
(3342) were added as Resolved; Complete Components (2685) was intentionally added
as Open. Exactly two explicit mistake events were added, for Farmland and Minimum
Time. Max Area of Island (695) remained byte-for-byte unchanged and selected its
existing renderer in browser regression.

Verification passed 43 visualizer tests, including independent reachability,
DSU, BFS, rectangle, repeated-Dijkstra, and bounded time-expanded oracles; 41
backend tests; the production build; and Ruff. `npm run check` completed 64 of 65
checks, with the remaining check being the expected live-browser skip. The
Impeccable detector returned `[]`, the final independent reviewer verdict was
SHIP, and the browser console contained no warnings or errors.

Browser review covered 1920×1080, 1366×768, 390×844, keyboard-opened inspector,
44px mobile controls, malformed JSON feedback, playback/inspector continuity,
and a 683px effective viewport as a CSS 200%-reflow equivalent. The retained
screenshots directly show the 10-isolated-node boundary, Farmland, the Floyd
matrix, mobile closed/open inspector states, the unchanged Max Area renderer, and
Minimum Time; they are in `.impeccable/review/graph-lessons`. The in-app browser
ignored native zoom keystrokes and exposed no live reduced-motion emulation
capability, so native browser zoom and live reduced-motion emulation remain
explicitly unclaimed.

## September 30 sequence, dependency, and memoized-recursion lessons

The bounded extension adds Triangle (120), Perfect Squares (279), Maximum
Nesting Depth (1614), Count Ways To Build Good Strings (2466), and Course
Schedule II (210). Each owns its canonical screenshot algorithm, strict parser,
typed copied frames, presets, renderer, input editor, and numeric/slug aliases.
Saved Python remains a separate reference, never executable teaching input.

Reusable presentation contracts:

- `components/StudyPrimitives.tsx` exports `SequenceStrip`, `DependencyGrid`,
  and `OperationLedger`. Strips show indexed values/characters, a labeled pointer,
  semantic states, and derived range annotations. Their local scrolling follows
  the active index without scrolling the page or interpolating algorithm values.
- `DependencyGrid` renders ragged triangular rows with separate input and cost
  labels, real parent connections, and explicit current/compared cells. It does
  not compute DP values or replace existing rectangular-grid renderers.
- `components/MemoizedRecursionWorkbench.tsx` presents supplied call ancestry,
  child return slots, memo entries, and evaluated expressions. `null` means an
  unknown or pending value, not zero. Its shared call snapshot contract lives in
  `core/memoized-recursion-types.ts`; traces must not import rendering modules.
- Course Schedule reuses `GraphTraversalWorkbench` and `FrontierLedger`.
  Directed arrowhead contrast and the readable minimum graph width are scoped
  to the new study workspace, leaving existing lesson rendering untouched.

The new `.study-workbench` layout preserves the incumbent diagram-first shell,
Bklit legend, Kokonut tabs, and Motion controls. Custom input and the inspector
start collapsed. Opening either retains the frame; editing pauses playback;
invalid input retains the last successfully built trace. Functional labels stay
at least 12px, controls remain 44px, and diagrams scroll locally. Memo and call
panels sit side by side on wide layouts and stack below 980px.

Source fidelity requirements:

- Triangle distinguishes its first-column assignment from interior parent
  comparisons. The final highlighted path is explicitly reconstructed from DP
  values, not represented as a predecessor array stored by the reference.
- Perfect Squares preserves seeded square memo entries, memo-before-zero guard
  order, ascending subtraction choices, returned child values, minimum updates,
  and the `square > remainder` break. The zero-return branch is unreachable for
  valid inputs in this seeded implementation; document that fact, never fabricate
  a zero call merely to illustrate the branch.
- Nesting Depth updates the maximum at a closing parenthesis **before** reducing
  current depth. Matched ranges are derived annotations, not reference state.
- Good Strings preserves `memo[high] = 1`, overflow checks, stopping contribution,
  zero-then-one recursion, addition after both returns, and modulo storage. Equal
  block lengths still represent two distinct appended strings and count twice.
- Course Schedule preserves input-edge order, numeric initial discovery, FIFO
  processing, zero-only enqueueing, the early no-zero guard, and final processed
  count. Show a partial recorded order separately from a failed empty result;
  blocked courses may depend on a cycle without belonging to that cycle.

Teaching limits are explicit next to each editor: Triangle 1–8 rows with exact
lengths 1…n and values −10,000…10,000; balanced arithmetic/digit expressions
1–64 characters; Perfect Squares n=1…40; Good Strings
1 ≤ low ≤ high ≤ 24 and 1 ≤ zero, one ≤ low; Course Schedule 1–12 courses with
unique valid non-self prerequisite pairs. Complete traces are not truncated.

Recorded verification, 2026-10-01:

- 49 visualizer tests passed, including independent exhaustive-path, BFS,
  parenthesis-stack, explicit-string/bottom-up, and DFS-cycle/order oracles.
  Tests cover presets, limits, intermediate invariants, independent snapshots,
  exact reference focus, aliases, and unchanged incumbent golden fixtures.
- `npm run check`: 70 passed, one expected optional Atlas live-browser skip.
  Build, 41 backend tests, Ruff check, and Ruff formatting passed. Existing large
  Dashboard/3D bundle warnings remain unrelated to these lessons.
- Live browser evidence covers all five lessons at 1366×768 and 390×844,
  intermediate diagrams and final answers, keyboard inspector continuity,
  editing/playback pause, invalid-input preservation, and local scrolling.
  Triangle additionally has a 390px inspector capture and 683px CSS reflow
  capture. Good Strings operated with the saved reduced-motion preference
  enabled; the original preference was restored after the check.
- 1920×1080 CSS layout was exercised without page overflow, but the in-app
  browser physically clipped captures to 1683px. Full 1920px visual acceptance
  remains unverified. Native zoom keystrokes did not change width/scale/DPR;
  683px is CSS reflow evidence, not native 200% zoom. Live OS reduced-motion
  emulation was unavailable and is not claimed.
- The fresh Impeccable reviewer identified one material arrowhead-contrast fix.
  Its verdict pass scored that fix resolved in the corrected desktop/mobile
  captures and returned SHIP at that scope. Hook detector reported no findings.
  The final browser console returned no warnings or errors. Browser regression
  confirmed the three protected lessons still use their original specialized
  traces, and Course Schedule's disconnected cycle returns failure after partial
  processing. Evidence lives in `.impeccable/review/september-lessons`.
- Five unique local records were created as Resolved with
  `record_initial_mistake: false`, no notes or mistake events. Hash comparison
  confirmed all 33 pre-existing full record responses unchanged. Coin Change II,
  N-Queens, and Hexadecimal remain protected.

At the September handoff, additional questions through Saturday, October 3 were
unassigned pending their screenshots and solutions. The six supplied algorithms
are documented as the separate October extension below; the completed five-lesson
batch and its evidence retain their original scope.

## October bracket, fill, and sorting lessons

The October extension adds Valid Parentheses (20), Flood Fill (733), Minimum Add
to Make Parentheses Valid (921), Score of Parentheses (856), Valid Parenthesis
String (678), and Wiggle Sort II (324). Each owns its canonical screenshot
`reference.py`, pure typed trace, strict parser, diagnostic presets, renderer,
input editor, and lesson definition. Register each definition once in
`registry.tsx`, with its problem slug and LeetCode numeric alias. Course Schedule
II (210) keeps its existing verified renderer and trace.

Reusable contracts:

- `components/IndexedStackRail.tsx` presents original character indexes with
  bottom-to-top order and the top on the right. The original index is the stable
  token identity, including repeated bracket values; labels distinguish top,
  stored, and empty resources. Its focusable region scrolls locally. It owns
  presentation, not push/pop logic or matching decisions.
- The same module's `BracketRibbon` reuses `SequenceStrip` for indexed input,
  the current read pointer, and read/unread labels. `BracketLegend` reuses Bklit's
  `StateLegend`, with cyan current state, violet stored resources, magenta
  rejection, and green completion. Symbols and labels accompany color.
- `components/BracketInputEditor.tsx` provides String/JSON modes through
  Kokonut's `SmoothTabs`. Invalid JSON can be repaired in JSON mode; input
  validity and permitted characters remain the adapter's responsibility.
- `core/reference-trace.ts` exports `referenceWriter`: match a complete trimmed
  source line, choose its exact occurrence when repeated, expose its one-based
  `codeLines` and `codeFocus`, and clone frame data with `structuredClone`.
  Repeated `pop`, `return`, or pointer-update lines must highlight the branch
  actually taken. The helper throws on a missing occurrence instead of silently
  highlighting a similar line. `bracketString` centralizes bounded character
  validation without requiring all bracket lessons to accept the same alphabet.
- Flood Fill reuses `GridTraversalBoard`, `FrontierLedger`, and
  `OperationLedger`. FIFO queue entries use distinct entry IDs even when their
  coordinates are equal. These identities must not be conflated with a stack's
  original character indexes.
- Score and Wiggle Sort reuse `SequenceStrip` and `OperationLedger`. Derived
  depth diagrams, occurrence IDs, and final inequality checks are labeled
  teaching annotations; they do not add variables or operations to the Python
  source.

| Lesson                                | Teaching input                                                                | Required source behavior                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valid Parentheses                     | 1–32 characters from `(){}[]`                                                 | Preserve opening detection, the empty-stack guard, then the `()`, `{}`, `[]` comparisons in that order. Match only the current top; reject a mismatched closer immediately. Final validity is `len(stack) == 0`.                                                                                                                                                             |
| Minimum Add to Make Parentheses Valid | 1–32 characters from `()`                                                     | Push openings. A closer pops if a resource exists; otherwise increment the missing-opening count. Add the remaining stack length after scanning. Show the count, not an invented repaired string.                                                                                                                                                                            |
| Score of Parentheses                  | 2–32 balanced characters from `()`                                            | This source has counters, not a stack. Decrement depth on a closer before testing the primitive `()` leaf and adding `2 ** depth`. Keep pointer advances, contributions, running score, and returned score distinct.                                                                                                                                                         |
| Valid Parenthesis String              | 1–32 characters from `()*`                                                    | The source names its opening deque `queue`, but both deques use append/pop as LIFO resources. Prefer an opening over a star during scan. In cleanup, reject a star before its remaining opening, then pop the opening and star separately. Only successful completion assigns unused stars the empty role. Resource-consumption order is not a final nested-pairing diagram. |
| Flood Fill                            | Rectangular 1–8 × 1–10 integer image; colors 0–9; valid zero-based `sr`, `sc` | Preserve right/down/up/left order, recolor then mark seen on dequeue, duplicate queued coordinates, and the already-seen `continue`. Neighbor predicates short-circuit in source order; untested terms read “Not evaluated.” Equal source/target colors still traverse; unique processed and actually changed pixel counts are separate. Return the working image.           |
| Wiggle Sort II                        | 1–12 integers in 0–5000 admitting a strict wiggle                             | Show `sorted(nums)` as one operation, the backward lower/upper pointers, alternating valley/peak writes into `nums`, and the odd-length peak guard. Unwritten cells retain original values. Python implicitly returns `None`; the final diagram verifies the modified array. Reject inputs that cannot meet the strict-wiggle guarantee.                                     |

The six lessons extend the incumbent `.study-workbench` hierarchy: presets and
playback precede the main ribbon or coordinate grid; the larger diagram sits
beside a compact operation ledger and stacks at 980px and below. Custom input
and the source inspector start collapsed. Opening either retains the frame,
editing pauses playback, and a failed build retains the previous applied trace.
Functional labels remain at least 12px, controls retain 44px targets, and large
ribbons, rails, diagrams, and code scroll in their own regions. Existing same-tab
navigation and shared system/saved reduced motion remain in use. Saved Python
is displayed separately and is never executed.

The extension keeps graphite tones, IBM Plex Sans interface hierarchy, DM Mono
indexes and measurements, cyan focus, violet structure, magenta rejection, and
green completion. Written Wiggle Sort destination cells use a scoped green
treatment consistent with their “Written result” legend; the active transfer
stays cyan. This is a lesson-state correction, not a new global token or visual
world. `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json` were preserved.
Pre-existing drift remains recorded rather than adopted as a rule: shared
`LessonButton` uses a 0.98 press scale, while DESIGN.md's button guidance says
“no scale.” The existing source adaptation and preference are unchanged.

Recorded verification, 2026-10-07:

- `npm run test:visualizers`: 56 passed. `npm run check`: 77 passed with one
  expected optional Atlas live-browser skip. All 41 backend tests and the
  production build passed; the incumbent large-chunk warning remains. The main
  detector ran once and returned `[]`; the audit reported zero findings.
- `.impeccable/review/october-lessons/browser-report.json` records all six
  lessons at 1366px, 900px, and 390px, keyboard inspector opening, playback,
  input editing, invalid-build trace preservation, 44px controls, and an empty
  browser console. System reduced motion was emulated and the saved preference
  exercised in an isolated browser. All API requests were intercepted for these
  lesson checks; they did not write records. The 683px capture is CSS reflow
  evidence, not native 200% browser zoom. The Windows computer-use entrypoint
  was unavailable; the disclosed browser fallback supplied this evidence.
- The independent finish reviewer requested F1: violet written Wiggle Sort
  cells contradicted the green legend. After the scoped destination correction,
  the reviewer confirmed green written cells and cyan active transfers at
  desktop, intermediate, mobile, and final states, returning SHIP for F1 only.
  This is not an unqualified approval of the whole surface.
- The authorized local API changes created six Resolved records with code and
  notes and no initial mistake events. Course Schedule II received notes only;
  its code, classification, and history were preserved. Full hashes for the 37
  unrelated records remained unchanged. The catalog grew from 38 to 44 and its
  Resolved count from 27 to 33; title/code/notes search under Resolved passed.
  A separate read-only SQLite process confirmed all seven source identities
  are Resolved with nonempty code, 8–11 note bullets each, and zero mistake
  events. A separate read-only browser check of the actual local catalog passed
  for all seven records: Resolved status and core-insight notes were visible,
  2D Visualization stayed in the same page and selected the specialized lesson,
  and the inspector reported “Reference code matches your saved text.” That
  check produced no API writes or page errors. No export, commit, or push was
  performed.

## October 7 Remove Invalid Parentheses extension

Remove Invalid Parentheses (301) adds `lessons/remove-invalid-parentheses/` and
one registry definition with numeric and slug aliases. Its Minimal Removal Lab
extends the incumbent study workbench: count the exact removal budget, follow
substring deletions, validate leaf candidates, then collect unique answers.
Presets and playback remain above the original-ID ribbon, wider candidate and
ancestry workspace, compact budget/validator ledger, and answer collector.
Custom input and the source inspector start collapsed.

Source and presentation contracts:

- Preserve the supplied `reference.py` exactly; it is displayed and simulated,
  never executed. The Python's `stack.clear()` retains the same list while
  switching its role from unmatched openings to accepted answer strings.
- Count unmatched closers plus remaining openings before search. Delete only
  parentheses from immutable substrings. Keep original character IDs stable
  while current indexes shift; pass the removed current index as the child's
  `ind`. Letters remain intact.
- Each call owns its candidate. Returning restores the unchanged caller and
  continues its remaining choices; there is no shared-string undo or successful
  return that cancels siblings. `backtrack` returns control, not a boolean.
- Check only at the exact budget. Accepted duplicates short-circuit validation;
  otherwise compare total counts, then reject any closer without an earlier
  opening. Equal counts alone do not establish validity. `seen` contains accepted
  strings only, not visited search states; repeated deletion paths still run.
- The active ancestry card follows entry and return by scrolling its own
  keyboard-focusable region. Never scroll the surrounding page to expose it.
  Empty strings, rejected prefixes, duplicates, resumed parents, and unique
  answers retain explicit text or symbols alongside semantic colors.
- Reuse `SequenceStrip`, `IndexedStackRail`, `OperationLedger`, Bklit
  `StateLegend`, Kokonut `SmoothTabs`, and shared `LessonMotion`/`LessonButton`.
  Preserve graphite surfaces, IBM Plex Sans language, DM Mono measurements,
  cyan current state, violet ancestry/openings, magenta deletion/rejection, and
  green answers. No dependency, raster, or global design-system change applies.

Teaching inputs are 1–12 lowercase ASCII letters and parentheses. A pure
counting pass rejects traces exceeding 12,000 frames before allocating copied
snapshots; accepted traces are complete. Invalid input or an excessive trace
preserves the previous applied trace, and editing pauses playback. String/JSON
modes stay synchronized. Shared layout, 12px labels, 44px controls, same-tab
navigation, and system/saved reduced motion remain in use.

Recorded verification, 2026-10-07:

- The final active-card fix passed all 62 visualizer tests, all 41 backend tests,
  and the production build. The general check passed 83 checks with one expected
  optional Atlas live-browser skip. Tests include an independent breadth-first
  minimum-deletion oracle over presets and exhaustive short strings, stable IDs,
  shifted child indexes, caller resumption, accepted-only deduplication,
  independent snapshots, exact source focus, limits, and registry/jump wiring.
- The main detector ran once on the changed UI files and returned `[]`.
  `.impeccable/review/remove-invalid-parentheses/browser-report.json` records
  bounded Edge checks at 1366px, 900px, and 390px: budget/deletion/validation/
  return/result states, keyboard, 44px controls, playback and editing, invalid
  rebuild preservation, same-tab navigation, and system/saved reduced motion.
  The browser console was empty; intercepted API requests made no data writes.
- The independent reviewer confirmed F1 active-call clipping resolved and
  returned SHIP at F1-only accepted-fix scope; this is not full-surface approval.
  The new
  `prefix-rejection-390-canvas.png` and `deep-return-390-canvas.png` captures show
  the complete active leaf and resumed parent. The Windows computer-use tool
  was unavailable; native 200% zoom remains unverified. The 683px capture is CSS
  reflow evidence only.
- The authorized API addition created one Hard, Resolved record classified as
  Constraint Search with DFS and Strings, exact canonical code, structured
  notes, and zero fabricated mistake events. All 44 unrelated records were
  preserved; the catalog now has 45 records and 34 Resolved. Title/code/notes
  search and Atlas inclusion passed; `.local/remove-invalid-record.json`
  records the result. Independent read-only SQLite verification found source
  key `remove-invalid-parentheses`, 12 note bullets across six sections, and zero
  mistake events. Numeric 301 is the registry alias.
- `.local/remove-invalid-acceptance.json` records actual persisted-catalog
  acceptance: Resolved status and notes visible, same-tab 2D navigation,
  specialized lesson selected, canonical reference match, no page errors, and
  no API writes during review. This workflow performed no export, commit, or
  push and preserved existing user changes.

## Distinct Squares and Maximum OR studios

Distinct Squares (2916) and Maximum OR Subsets (2044) extend the incumbent
study workbench through `lessons/distinct-squares-segment-tree/` and
`lessons/maximum-or-subsets/`. Each owns its canonical raw Python, pure typed
trace, presets, renderer, editor, and one registry definition with LeetCode
numeric and slug aliases. Canonical Python is displayed and simulated, never
executed. Keep these source-specific contracts:

- Distinct Squares defaults to Canvas-local Subarray Counts; Lazy Tree State
  shares the exact frame. Switching views or inspecting a source node calls the
  generic `onInteract` pause callback, without problem-specific page branches.
  Keep sealed logical counts separate from the labeled pending +1 preview.
  The tree shows actual source indexes, stored S/Q/lazy values, and active
  `update`/`push`/`apply` ancestry, including deferred children. Update Q with old
  S before changing S; push left then right and clear the parent tag afterward.
  Keep guided checkpoints, all transitions, and endpoint/push/contribution jumps.
- Maximum OR accepts positive values only. Build the fixed target, explore take
  before skip, check tuple memo before the terminal condition, and leave terminal
  returns uncached. Sparse memo stores continuation counts, including zero;
  equal values at different indexes remain different choices. Show active
  ancestry and pending child slots; returned counts use green, while null pending
  slots use magenta. Label derived take previews separately from evaluated OR.
- `NumberArrayInputEditor` provides synchronized Array/JSON modes. Strict
  `numericArray` parsing accepts 1–12 values for 2916 or 1–8 for 2044, each an
  integer in 1…100,000. `completeTrace` counts the full simulation before cloning
  snapshots, rejecting over 12,000 frames without applying a partial trace.
  Editing pauses playback; failed builds preserve the last applied trace.
- Reuse `SequenceStrip`, `OperationLedger`, `FrontierLedger`, Bklit legend,
  Kokonut tabs, and shared Motion/reduced-motion controls. Preserve the wider
  diagram and compact ledger, stacking below 980px, local keyboard scrolling,
  readable 12px labels, 44px controls, and same-tab navigation. No new visual
  world, dependency, raster asset, or global design-file change applies.

Completion evidence is recorded in the existing visualizer surface brief and
`.impeccable/review/counting-studios/browser-report.json`: 69 visualizer tests,
90 general checks plus one expected optional live-Atlas skip, build, 71 backend
tests, and Ruff passed. The detector ran once with `[]`; the independent verdict
accepted the returned-count color fix at F1-only scope. Native 200% zoom remains
unverified; 683px is CSS reflow evidence. The previously recorded button press
scale drift remains unmodified and is not a new system rule.

## Digit-Sum Swap Studio

Minimum Swaps to Sort by Digit Sum (3551) extends the incumbent workbench through
`lessons/minimum-swaps-digit-sum/`: one canonical raw Python reference, a pure
typed trace, ten presets, derived annotations, renderer, editor, and one
source-scoped registry definition with numeric and slug aliases. Saved Python
remains reference text and is never executed.

- Accept 1–12 distinct positive safe integers, at most 1,000,000,000 each.
  `numericArray` and `NumberArrayInputEditor` accept optional `maximumValue` and
  `distinct` settings; their existing 100,000/non-distinct defaults remain.
  `completeTrace` counts the full simulation before cloning snapshots and rejects
  over 12,000 frames without replacing the applied trace.
- Evaluate `add_digits` in input order, extracting rightmost digits with modulo
  before floor division. Each helper returns before the target is assigned;
  sort by digit sum, then numeric value. Build `pos` in input order and label
  missing entries explicitly. Compare, look up `j`, prepare both map writes,
  exchange both values atomically, then increment `count`. The prepared map may
  temporarily disagree with `nums`; retain the source's last assigned `j`.
  Confirmed prefixes are derived only after processing each position.
- Label cycle decomposition as a proof derived from the original-to-target
  permutation, not an executed Python operation. Value/map inspection calls
  generic `onInteract` to pause at the same frame without changing algorithm
  state. Motion tracks stable value identity and honors system/saved preferences.
- Keep the aligned arrays wider than the ledger. DOM order is arrays, ledger,
  then map/history/proof; below 980px the ledger follows the arrays before the
  longer sections. Preserve local keyboard scrolling, 12px labels, 44px targets,
  synchronized Array/JSON input, same-tab navigation, and collapsed input/source
  inspection. The result removes the active pointer but labels the last source
  `i`. Graphite, IBM Plex Sans, DM Mono, cyan active/prepared state, violet target,
  magenta displacement, and green confirmation remain incumbent.

Completion and evidence are recorded in the visualizer surface brief and
`.impeccable/review/digit-sum-studio/browser-report.json`. This extension adds no
dependency, shipping raster, or global design-system change.
