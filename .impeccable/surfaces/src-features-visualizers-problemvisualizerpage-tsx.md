---
version: 1
slug: "src-features-visualizers-problemvisualizerpage-tsx"
primary_target: "src/features/visualizers/ProblemVisualizerPage.tsx"
related_targets:
  - "src/features/visualizers/components/TraversalPrimitives.tsx"
  - "src/features/visualizers/components/StudyPrimitives.tsx"
  - "src/features/visualizers/components/MemoizedRecursionWorkbench.tsx"
  - "src/features/visualizers/core/memoized-recursion-types.ts"
  - "src/features/visualizers/components/styles/study-workbench.css"
  - "src/features/visualizers/lessons/triangle/"
  - "src/features/visualizers/lessons/maximum-nesting-depth/"
  - "src/features/visualizers/lessons/perfect-squares/"
  - "src/features/visualizers/lessons/good-strings/"
  - "src/features/visualizers/lessons/course-schedule/"
  - "src/features/visualizers/components/IndexedStackRail.tsx"
  - "src/features/visualizers/components/BracketInputEditor.tsx"
  - "src/features/visualizers/components/styles/indexed-stack.css"
  - "src/features/visualizers/core/reference-trace.ts"
  - "src/features/visualizers/lessons/valid-parentheses/"
  - "src/features/visualizers/lessons/minimum-add-parentheses/"
  - "src/features/visualizers/lessons/score-parentheses/"
  - "src/features/visualizers/lessons/valid-parenthesis-string/"
  - "src/features/visualizers/lessons/flood-fill/"
  - "src/features/visualizers/lessons/wiggle-sort/"
---

# Problem visualizer — graph lesson family

## Direction contract — Remove Invalid Parentheses

THESIS: Minimum deletions define a search budget; equal counts alone do not prove
validity. Show one active ancestry, not an unreadable exponential tree.

OWN-WORLD: Incumbent graphite workbench, cyan current token, violet ancestry and
stored openings, magenta deleted tokens, green unique answers; readable language
and monospace strings, indexes, and measurements.

STORY: Count unmatched parentheses, follow a deletion, inspect its validator,
then resume the unchanged caller. Distinguish accepted-result deduplication from
search pruning. Letters are never deletion choices.

FIRST VIEWPORT: Indexed original string above the wider candidate ribbon and
active ancestry; compact removal and validation ledger on the right. Unique
answers sit below. Playback remains above; input and source start collapsed.

FORM: Precisely specified incumbent extension, code-led; no concept seed applies.
Signature: returning from a candidate restores its parent's string and resumes
the next current-index choice, without an invented shared-state undo.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Direction contract — October bracket, fill and sorting extension

THESIS: Reveal the actual changing state and each decisive condition, rather than
an unrelated animation of the final answer. Six new lessons extend the existing
diagram-first surface; Course Schedule II retains its verified lesson.

OWN-WORLD: Preserve graphite surfaces, readable sans-serif explanations, indexed
mono measurements, cyan focus, violet structure, magenta rejection and green success.

STORY: Choose a preset, step through the screenshot algorithm, inspect its source,
then vary bounded input. Stack identities, FIFO duplicates, depth contributions
and reverse-half pointers make each result explainable.

FIRST VIEWPORT: Presets and playback precede a wide indexed ribbon or coordinate
grid. The primary state occupies the larger column beside a compact operation
ledger. Custom input and the source inspector remain initially collapsed.

FORM: Precisely specified incumbent extension, code-led; no concept seed applies.
Shared indexed stack rails connect closers to the current top; flood fill exposes
dequeue-time marking, and wiggle sort exposes lower/upper source transfers.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Job and direction

Teach graph, grid, and shortest-path algorithms through one operation at a time,
without implying the saved Python was executed. Preserve Algo Atlas's graphite,
cyan, violet, amber, and mono-instrument identity. The lesson diagram is the
primary surface; custom input and code cross-checking are supporting tools. Their
initially collapsed state keeps the current algorithm operation dominant while
leaving input variation and source auditing available on demand.

## Hierarchy

1. Problem title, status, one-sentence strategy.
2. Compact preset selector, collapsed custom input, and Build steps action.
3. Playback controls and current operation.
4. Large semantic diagram with state legend and frontier/state/result ledgers.
5. Closed-by-default code/steps inspector, docked on wide screens and presented
   as a mobile drawer.

## Reusable language

- Use `GraphTraversalWorkbench` for stable nodes and real edges.
- Use `GridTraversalBoard` for cell topology, walls, values, gates, bounds, and paths.
- Use `FrontierLedger` for queue/stack/heap order and item lifecycle.
- Use `DistanceMatrix` for Floyd dependencies and threshold classification.
- Use `MistakeCheckpoint` only on a real immutable trace frame.
- Reuse Bklit `StateLegend`, Kokonut `SmoothTabs`, and restrained Motion controls.

## State coverage and shipped scope

- Keys and Rooms covers directed discovery, key inspection, queue order,
  processing, and the final reachability result.
- Complete Components separates component collection from degree auditing and
  accepted/rejected verdicts. Its 10-isolated-node boundary keeps every singleton
  visible and counts all ten complete components.
- Nearest Exit covers BFS layers, invalid-neighbor rejection, discovery, queueing,
  exit checks, and the reconstructed path.
- Farmland covers scan order, queue state, visited cells, coordinatewise rectangle
  bounds, and recorded groups. Maximum Fish covers recursive entry, neighbor
  inspection, returned subtotals, completed ponds, and the maximum.
- Find the City covers infinity and edge initialization, active Floyd
  dependencies, relaxation, threshold membership, and largest-index tie breaking.
  Minimum Time covers heap order, stale entries, waits, alternating movement cost,
  relaxation, and destination finalization.

These are seven named lesson folders and registry entries. `MistakeCheckpoint`
appears only for the source-grounded Farmland and Minimum Time mistakes. Max Area
of Island remains on its pre-existing lesson renderer and is a regression guard,
not part of the new reusable family.

## Interaction and accessibility

Every visible control has a 44px target on touch layouts. Preserve the frame when
opening or closing the inspector. Show invalid input beside the editor and retain
the last applied trace. Keep diagrams locally scrollable, labels at least 12px,
keyboard focus visible, and motion optional through the shared reduced-motion
preference. Never encode algorithm state with color alone.

## Verification snapshot

Reviewed at 1920×1080, 1366×768, 390×844, and a 683px 200%-reflow equivalent.
Mobile keyboard opening, inspector continuity, input errors, overflow, and browser
console output were checked; the console was empty. The retained screenshots
directly cover the 10-isolated-node case, Farmland, the Floyd matrix, mobile
closed/open inspector states, the unchanged Max Area renderer, and Minimum Time.
They live in `.impeccable/review/graph-lessons`.

`npm run check` completed 64 of 65 checks with one expected live-browser skip;
the production build, 43/43 visualizer tests, 41/41 backend tests, and Ruff passed.
The detector returned `[]`, and the final independent reviewer verdict was SHIP.
The 683px capture is CSS reflow evidence only. Native browser zoom and live
reduced-motion emulation were unavailable in the in-app browser and are not
claimed.

## Protected behavior

Do not change saved Python, statuses, mistake history, exports, backend contracts,
the global shell, Atlas home, or Max Area of Island while refining this family.

## September 30 catalog extension

Triangle, Maximum Nesting Depth, Perfect Squares, Count Ways to Build Good
Strings, and Course Schedule II extend this incumbent surface through five named
lesson folders and registry entries. Keep the graphite/cyan/violet diagram-first
hierarchy, shared Bklit state legend, Kokonut tabs, restrained Motion controls,
and initially collapsed custom editor and code/steps inspector. Each lesson
simulates its local canonical reference with immutable, code-linked snapshots;
arbitrary saved Python is never executed.

The reusable study components are presentation only:

- `SequenceStrip` shows indexed cells, a labeled current pointer, and explicitly
  derived range labels. Its keyboard-focusable region scrolls locally; pointer
  movement brings the active cell into view without scrolling the page.
- `DependencyGrid` shows ragged triangular rows with the input above the current
  cost. Real preceding-row parent edges remain visible, with compared parents
  highlighted. Initialized infinity is distinct from an evaluated cost.
- `MemoizedRecursionWorkbench` presents an indexed memo, active call ancestry,
  child return slots, and the evaluated expression. A null memo entry is unknown
  or pending, never a computed zero. The active call is last in the ancestry;
  suspended callers remain labeled as waiting for a child.
- `MemoCallSnapshot` lives in the neutral core type module so pure traces share
  the call-state contract without importing a renderer.
- Course Schedule II reuses `GraphTraversalWorkbench` and `FrontierLedger` for
  prerequisite-to-course edges and the FIFO ready queue. The visible arrowhead
  correction is scoped to study workbench graph markers (`#607086`).

Functional annotations remain at least 12px, touch controls retain 44px targets,
and the study diagram/state columns stack at 980px and below. Large diagrams,
memo strips, and call ancestry scroll within their own regions. Opening the
editor or inspector preserves the frame; editing pauses playback, and a failed
rebuild retains the last applied trace with an explanatory alert.

| Lesson | Bounded input | Reference fidelity |
| --- | --- | --- |
| Triangle | 1–8 rows, row `r` has `r + 1` integer values in −10000…10000 | Show initialization, first-column updates, valid parent comparisons, stored costs, and the final minimum. The final optimal path is explicitly derived from completed costs; the reference does not store predecessors. |
| Maximum Nesting Depth | 1–64 permitted expression characters with balanced parentheses | Show the pointer and both counters. Record the maximum before decrementing on a closing parenthesis. Matched ranges are derived annotations. |
| Perfect Squares | Integer `n` in 1–40 | Show generated squares, seeded square hits, membership checks, recursion, child returns, and memo writes. The source's zero-return base case is unreachable for valid traces because seeded squares return before recursion reaches zero. |
| Good Strings | `1 ≤ low ≤ high ≤ 24`; both block lengths in `1…low` | Show the seeded high-length result, valid stopping contribution, overflow return, both child slots, addition, and modulo memo write. Equal block lengths are two distinct choices whose returned counts are both added. |
| Course Schedule II | 1–12 courses; unique prerequisite pairs with no self-edges | Preserve FIFO order, indegree changes, enqueue/dequeue, and recorded versus returned order. A partial processed order returns failure; blocked courses may be cycle members or depend on a cycle. |

The authorized local API additions produced five Resolved records with zero
mistake events. All 33 existing records retained their full hashes. Coin Change
II, N-Queens, and Hexadecimal are protected regression surfaces and received no
changes. This bounded five-lesson extension is complete; future Saturday,
October 3 additions remain unassigned until their screenshots arrive.

## October 1 verification

`npm run test:visualizers` passed 49 tests. `npm run check` passed 70 of 71 checks
with one expected optional Atlas live-browser skip. The production build passed
with existing chunk-size warnings; all 41 backend tests and Ruff checks passed.
These checks establish trace, registry, source-focus, and boundary coverage;
browser evidence is recorded separately below.

Twenty main captures in `.impeccable/review/september-lessons` cover all five
lessons at 1366px desktop and 390px mobile, the initial 1366px overview, and
partial 1920px views. The 1920px CSS layout rendered, but its screenshots were
physically clipped at the right edge at 1683px. Full 1920px visual verification
remains unverified.

Browser interaction covered all five final states, keyboard inspector continuity,
editor opening continuity, editing pausing playback, and invalid `{}` input
showing an alert while retaining the last trace. The Triangle inspector was
checked at 390px; its 683px CSS reflow check showed no horizontal page overflow.
Native Control-plus zoom was ignored, with viewport width, scale, and DPR
unchanged, so native 200% zoom remains unverified. The saved reduced-motion
preference was toggled through the UI, the Good Strings addition was operated,
and the setting was restored. OS reduced-motion live emulation was unavailable;
this does not establish full OS preference coverage.

The initial independent review requested one fix: black Course Schedule
arrowheads. After the scoped marker correction, the reviewer returned SHIP with
the sole finding resolved at 1366px and 390px; that verdict does not cover the
clipped full-width 1920px view. The hook detector reported no findings, and no
second main detector run is claimed. The final browser console check returned no
warnings or errors. Two additional captures show Triangle's 683px reflow and
390px inspector. Browser regression confirmed Coin Change II, N-Queens, and
Hexadecimal still build their original specialized traces without the new study
workspace. Course Schedule's disconnected-cycle preset retained the partial
recorded order separately from its failed empty return.

## October 7 bracket, fill, and sorting extension

Valid Parentheses (20), Flood Fill (733), Minimum Add to Make Parentheses Valid
(921), Score of Parentheses (856), Valid Parenthesis String (678), and Wiggle
Sort II (324) extend the existing surface through six named lesson folders and
registry definitions. Course Schedule II keeps its existing code, trace, and
renderer. The October direction contract above remains the authority; no new
world or global design-system change applies.

The indexed input ribbon precedes the main diagram. `IndexedStackRail` presents
original character identities from bottom to top, with the top on the right,
explicit empty state, and a locally scrollable keyboard region. The opening and
star rails in Valid Parenthesis String are both LIFO resources despite the
source's `queue` variable name. Flood Fill instead presents a front-first FIFO
ledger whose entry IDs preserve duplicate coordinates. These identities and
orders are part of the meaning, not interchangeable visual styling.

`BracketInputEditor` reuses Kokonut `SmoothTabs` for String/JSON input, and the
ribbon/rails reuse Bklit `StateLegend` and restrained shared Motion behavior.
`referenceWriter` in the neutral core maps each frame to a complete source line
and its exact repeated occurrence, then clones its payload. Every new lesson
owns a canonical raw Python reference, typed immutable trace, bounded parser,
diagnostic presets, input editor, and registry aliases. The reference is
simulated; arbitrary saved Python is never executed.

| Lesson | Bounded input | Decisive source states |
| --- | --- | --- |
| Valid Parentheses | 1–32 characters from `(){}[]` | Opening push, empty-stack guard, ordered round/curly/square top comparisons, pop or immediate rejection, then final stack emptiness. |
| Minimum Add to Make Parentheses Valid | 1–32 characters from `()` | Opening push, closer pop or missing-opening increment, then addition of the unmatched-opening count. No generated repaired string. |
| Score of Parentheses | 2–32 balanced characters from `()` | Actual pointer, depth, and running score; decrement before primitive-leaf `2 ** depth`; separately recorded contributions. The depth diagram is derived, not a reference stack. |
| Valid Parenthesis String | 1–32 characters from `()*` | Opening-before-star scan preference, separate LIFO rails, ordered cleanup check that a closing star follows its opening, and separate pops. Unused stars become empty only on success; consumption is not final nested pairing. |
| Flood Fill | 1–8 × 1–10 image, colors 0–9, valid zero-based start | Right/down/up/left candidates, source-order short-circuit predicates, recolor then mark seen on dequeue, duplicate entries, already-seen skip, and final image. Source equals target still traverses; processed and changed counts differ. |
| Wiggle Sort II | 1–12 integers in 0–5000 with strict-wiggle feasibility | One sorted-copy operation, backward lower/upper pointers, alternating in-place destination writes, pointer advances, and odd-length guard. Final inequalities are derived checks; the Python return is implicitly `None`. |

The primary diagram keeps more width than the compact operation ledger, then
stacks at 980px and below. Presets and playback remain first, with the custom
editor and inspector initially collapsed. Opening either preserves the frame;
editing pauses playback; invalid builds retain the previous trace. Labels meet
the 12px functional floor, touch controls retain 44px targets, and large diagrams
scroll locally. Existing same-tab navigation is retained.

Observed palette and type follow the incumbent system: graphite surfaces,
IBM Plex Sans language, DM Mono indexes and values, cyan current state, violet
structure, magenta rejection, and green completion. The Wiggle Sort correction
scopes green written destination cells to `.wiggle-destination`; current
transfers remain cyan and shared result styling remains unchanged. Existing
global product/design files were preserved. The shared button's 0.98 press
scale conflicts with DESIGN.md's pre-existing “no scale” wording; it was not
repaired or promoted into the global system during this extension.

## October 7 verification and record evidence

The main run passed 56 visualizer tests, 77 checks with one expected optional
live-browser skip, 41 backend tests, and the production build. The existing
large-chunk warning remains. The main detector ran once with `[]`; audit findings
were zero. The browser report and screenshots are in
`.impeccable/review/october-lessons`.

The isolated browser report covers all six lessons at 1366px, 900px, and 390px,
keyboard inspector continuity, play/pause, input editing, invalid-build trace
preservation, 44px controls, system reduced-motion emulation, and the saved
preference. Its console is empty and every API request was intercepted, so this
lesson review made no data writes. The 683px screenshot establishes CSS reflow,
not native 200% browser zoom. Windows computer-use was unavailable and the
browser fallback was disclosed.

The independent review returned FIX for F1: violet written Wiggle Sort cells
contradicted the green “Written result” key. Corrected captures showed green
written cells and cyan active transfers across desktop, 900px, 390px, and final
states. The follow-up verdict was SHIP at F1-only scope; broader visual acceptance
must not be inferred from that verdict.

The authorized catalog API changes created six Resolved records with notes,
canonical code, and no initial mistake events. Course Schedule II received
notes only, preserving its code, classification, and history. All 37 unrelated
full-record hashes remained unchanged. Counts changed from 38 to 44 total and
27 to 33 Resolved; title/code/notes searches under Resolved passed. Independent
read-only SQLite inspection found all seven source identities Resolved with
nonempty code, 8–11 note bullets each, and zero events. A separate read-only
browser acceptance check of the actual local catalog passed for all seven:
Resolved status and core-insight notes were visible, 2D Visualization remained
in the same page and loaded the specialized lesson, and the inspector reported
“Reference code matches your saved text.” It recorded no API writes or page
errors. No export or Git publication occurred.

## October 7 Remove Invalid Parentheses implementation

Remove Invalid Parentheses (301) implements the direction contract above through
`lessons/remove-invalid-parentheses/`, its pure typed trace, canonical raw Python
reference, bounded parser, diagnostic presets, renderer, input editor, and one
registry definition with numeric/slug aliases. Minimal Removal Lab preserves
the incumbent world and shared route. Presets and playback precede the original
ID ribbon; the wider candidate/ancestry workspace sits beside a compact budget
and validator ledger, with unique answers below. The custom editor and source
inspector start collapsed.

The budget scan seals unmatched closers plus remaining openings before search.
Each deletion builds an immutable substring, keeps original IDs, shifts current
positions, and passes the removed current index into the child. Letters are
never deleted. The active ancestry marks suspended callers and locally follows
the active leaf or resumed parent without scrolling the page. Returning resumes
the unchanged caller's loop; it does not undo a shared string or stop siblings.

Leaves use the exact removal budget. Accepted duplicates skip `check(s_loc)`;
other leaves compare opening/closing counts before scanning prefix validity.
`seen` stores accepted answers, not search states. The validator returns a
boolean; `backtrack` returns control. Python's `stack.clear()` reuses the same
list as the answer collector after the opening-count phase. The canonical
reference remains exact and is never executed.

Inputs accept 1–12 lowercase ASCII letters and parentheses. A pure counting pass
enforces the 12,000-frame cap before allocating snapshots; no partial trace is
applied. Editing pauses playback, invalid rebuilds retain the applied trace,
and String/JSON modes remain synchronized. The workspace reuses `SequenceStrip`,
`IndexedStackRail`, `OperationLedger`, Bklit `StateLegend`, Kokonut `SmoothTabs`,
and shared Motion controls. Graphite surfaces, IBM Plex Sans text, DM Mono
strings/indexes, cyan current state, violet ancestry/openings, magenta rejection,
and green unique answers remain incumbent. Labels, local keyboard scroll regions,
44px targets, same-tab navigation, and system/saved reduced motion carry through.
No raster, dependency, or global design-file change applies.

## Remove Invalid Parentheses verification and record evidence

The final active-card fix passed 62 visualizer tests, 41 backend tests, and the
production build. The general check passed 83 checks with one expected optional
live-browser skip. The main detector ran once on changed UI files and returned
`[]`. The bounded Edge report and captures live in
`.impeccable/review/remove-invalid-parentheses`; they cover 1366px, 900px, and
390px, budget/deletion/validator/return/result states, keyboard, 44px controls,
playback/editing/rebuild preservation, input-mode synchronization, same-tab
navigation, and system/saved reduced motion. The console was empty and intercepted
API requests made no writes.

The independent finish reviewer confirmed the active-call clipping finding F1
resolved and disposition SHIP at F1-only accepted-fix scope; this is not
full-surface approval. The additional
`prefix-rejection-390-canvas.png` and `deep-return-390-canvas.png` captures show
the full active leaf and resumed parent. Native Windows computer-use was
unavailable. Native 200% browser zoom is unverified; 683px establishes CSS reflow
only. The shared button's previously documented 0.98 press scale drift remains
unrepaired and is not promoted into the global system.

The authorized local API addition produced one Hard, Resolved record with
Constraint Search, DFS, and Strings classification, exact canonical code,
structured notes, and zero mistake events. All 44 unrelated records remained
preserved; counts are 45 total and 34 Resolved. Title/code/notes searches and
Atlas inclusion passed in `.local/remove-invalid-record.json`. Independent
read-only SQLite verification confirmed source key `remove-invalid-parentheses`,
12 note bullets across six sections, and zero events. Numeric 301 is the registry
alias. Actual persisted-record browser acceptance in
`.local/remove-invalid-acceptance.json` passed: status/notes visible, same-tab
2D route, specialized lesson, canonical reference match, zero page errors, and
zero API writes during review. This workflow performed no export, commit, or
push and preserved existing user changes.

## Direction contract — Distinct Squares and Maximum OR

THESIS: Two source-linked lessons explain aggregate updates and counted choices, not decorative trees. Read mode: make the next state understandable.

OWN-WORLD: Preserve the graphite instrument, IBM Plex Sans language, DM Mono data, cyan current state, violet structure, magenta deferred/rejected evidence and green committed results. This is an incumbent extension, not a new visual world.

STORY: 2916 connects changed subarray starts to squared-sum updates and deferred child tags. 2044 connects index choices to bit unions and reusable suffix counts. Both preserve the supplied Python.

FIRST VIEWPORT: Existing playback and indexed input lead. 2916 defaults to a wide count strip beside its contribution ledger; linked tabs reveal the interval tree at the same frame. 2044 places aligned bit rows and take/skip branches beside a return ledger, with ancestry and sparse memo below. Mobile stacks panels and scrolls wide diagrams locally.

FORM: Confirmed two linked views for 2916; incumbent diagram-first composition for both. No concept seed or comp is required for this scoped extension. Signature interactions are left/right lazy-tag transfer and memo-count return; motion never invents intermediate values.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Distinct Squares and Maximum OR completion

The final direction contract above is implemented by
`lessons/distinct-squares-segment-tree/` (2916) and
`lessons/maximum-or-subsets/` (2044), with one registry definition per lesson and
LeetCode numeric/slug aliases. Both retain exact canonical raw Python, bounded
strict input, immutable source-linked frames, diagnostic presets, and the shared
diagram-first shell. Saved Python is never executed.

2916 opens in Subarray Counts with committed logical counts, a separately labeled
pending +1 preview, and an endpoint contribution history. Its Canvas-local Lazy
Tree State tab preserves that frame and pauses playback. The real deferred tree
exposes stored S/Q/lazy, source node indexes and intervals, active helper ancestry,
overlap checks, and left-then-right propagation before clearing the parent tag.
The formula ledger uses old S when updating Q. Guided checkpoints coexist with
all transitions and endpoint/push/contribution jumps; inspecting a node also uses
the generic Canvas `onInteract` pause contract.

2044 aligns bit rows with indexed take/skip choices, a return ledger, active
ancestry, and sparse tuple memo. It builds the fixed target, takes before
skipping, checks memo before base, and never caches terminal returns. Stored zero
is a computed count; null remains pending. Equal values at different indexes
retain separate subset choices. Derived take previews are labeled; completed
branch counts are green and pending child slots magenta.

Array/JSON editors accept 1–12 positive integers for 2916 and 1–8 for 2044, at
most 100,000 each. The shared `completeTrace` counting pass enforces 12,000 frames
before snapshot allocation. Invalid or excessive builds keep the previous trace;
editing pauses playback. Graphite surfaces, IBM Plex Sans language, DM Mono
measurements, cyan current state, violet structure, magenta deferred/pending
evidence, and green committed results match the incumbent design. The wider
diagram and compact ledger stack below 980px; diagrams, memo, and ancestry scroll
locally. Shared legends, tabs, Motion controls, focus, 12px labels, 44px targets,
same-tab navigation, and system/saved reduced motion remain in use. `PRODUCT.md`,
`DESIGN.md`, and the design sidecar are preserved; no dependencies or shipping
raster assets were added.

## Counting studios verification and record evidence

Final `npm run check` passed 90 checks with one expected optional live-Atlas
skip, including types, architecture, and formatting. All 69 visualizer tests,
the production build, 71 backend tests, Ruff check, and Ruff formatting passed
(57 files already formatted). After F1, the seven scoped tests and build passed
again. The main detector ran once and returned `[]`; it was not rerun.

The browser report and captures in `.impeccable/review/counting-studios` cover
1366px, 900px, and 390px, plus 683px CSS reflow; the deep OR call and 12-value
tree boundary; linked-view frame preservation and pause; custom/invalid input;
keyboard inspector continuity; same-tab navigation; and system/saved reduced
motion. The report passed with an empty console and zero API writes. Native
Windows computer-use was unavailable, so bundled Edge Playwright supplied this
evidence. Native 200% browser zoom remains unverified.

The fresh independent finish review found one material issue, F1: returned OR
branch counts used the pending color. One fix batch and matching desktop/mobile
recaptures established green returned counts and magenta null slots; the reviewer
confirmed F1 resolved and disposition SHIP at F1-only scope. This verdict is not
a whole-surface clean re-audit. The retained `or-branches-1366-canvas.png` and
`or-branches-390-canvas.png` show the correction. The previously documented shared
button 0.98 press scale versus DESIGN.md's “no scale” drift remains unrepaired
and is not canonized as a global rule.

The authorized existing-API additions used `record_initial_mistake: false` and
created two Resolved records with exact canonical code, correct classification,
12 note rows each, and zero mistake events. All 45 unrelated records were
preserved; totals are 47 records and 36 Resolved. Source keys are
`subarrays-distinct-element-sum-of-squares-ii` and
`count-number-of-maximum-bitwise-or-subsets`; numeric keys are visualizer aliases.
`.local/counting-studios-records.json` records canonical matches, title/code/note
search, and Atlas inclusion. Atlas node selection was not checked. Independent
read-only SQLite verification confirmed both persisted source identities and
counts. Actual local-API/browser acceptance in
`.local/counting-studios-acceptance.json` passed visible notes/status, same-tab
specialized lessons, canonical reference matches, zero errors, and zero API
writes during review. No schema, export, commit, push, or scheduler change applies.

## Direction contract — Digit-Sum Swap Studio

THESIS: Sorting keys define a unique target; the position map locates each required value. Make map preparation, atomic exchange, and counting separate, source-linked moments.

OWN-WORLD: Inherit graphite surfaces, IBM Plex Sans language, DM Mono values, cyan active exchanges, violet targets, magenta displacement, and green confirmed prefixes. This is a Read-mode extension, not a new visual world.

STORY: Extract digits right-to-left, compare tuple keys, inspect the working/target alignment, prepare both map entries, swap, and confirm the next position. Explain minimum swaps with a separately labeled derived cycle panel.

FIRST VIEWPORT: Presets and playback precede a wide aligned working/target ribbon. A compact operation ledger and digit/value inspector sit beside it; position-map updates and swap history follow. Input, original-array detail, cycle proof, and source start collapsed. Mobile stacks panels and pans strips locally.

FORM: Approved, precisely specified incumbent extension; no concept seed or comp applies. Signature: map writes visibly precede the two-card exchange, with count updating afterward. Clicking values inspects and pauses, never edits the algorithm.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Digit-Sum Swap Studio completion

The direction contract above is implemented by
`lessons/minimum-swaps-digit-sum/`, with one source-scoped registry definition for
`minimum-swaps-to-sort-by-digit-sum` and numeric alias 3551. The lesson owns its
exact 35-line screenshot Python, pure typed immutable trace, ten diagnostic
presets, derived cycle proof, renderer/styles, editor, and adapter. Saved Python
is displayed and simulated, never executed. No dependency or shipping raster was
added.

The trace evaluates each digit-sum helper in input order, with modulo before
floor division, and returns all keys before assigning the tuple-sorted target.
It exposes partial map initialization and missing entries, source comparisons
and lookup, both map writes before the atomic exchange, and the later counter
update. The map's temporary disagreement with the array is explicit. Last
assigned `j` remains source state; confirmed prefixes and original-to-target
cycles are labeled derived annotations. The result removes the active pointer
while retaining the last source `i` in the ledger.

Inputs accept 1–12 distinct positive safe integers up to 1,000,000,000. Shared
parser/editor options preserve existing 100,000/non-distinct defaults; the reused
12,000-frame guard counts before cloning. Invalid builds retain the applied
trace and editing pauses playback. Value/map inspection pauses at the same frame
through generic `onInteract`. Presets, speed, Next swap/confirmed-position jumps,
custom input, source inspection, and same-tab routing remain available.

The incumbent graphite, IBM Plex Sans, DM Mono, cyan active/prepared state,
violet target, magenta displacement, and green confirmation agree with the
retained Wiggle Sort mobile calibration. Wide arrays sit beside the compact
ledger; DOM order is primary arrays, ledger, then secondary map/history/proof.
At 980px and below the ledger follows the arrays before the long sections.
Local scrolling, text/symbol state cues, 12px labels, 44px controls, stable value
identity, and system/saved reduced motion are retained. `PRODUCT.md`, `DESIGN.md`,
and `.impeccable/design.json` are preserved.

## Digit-Sum Swap Studio verification and record evidence

Recorded completion: 2026-10-18, Asia/Calcutta. Final `npm run check` passed 96
checks with one expected optional live-Atlas skip; all 75 visualizer tests, 71
backend tests, production build, Ruff check, and Ruff formatting passed (57 files
already formatted). The existing large-chunk warning and two incumbent backend
deprecation warnings remain. Six new tests cover independent string digit sums
and breadth-first minimum-swap answers, helper zeros/billion boundary, source
order/map preparation/count timing, confirmed prefixes, independent snapshots,
source focus, parser/default compatibility, frame cap, aliases/jumps, and SSR.

Two bounded self-QA rounds corrected mobile ledger placement in one batch. The
main detector ran once on the new Canvas/styles and shared editor, returning
`[]`. The fresh independent finish reviewer returned full-surface SHIP with no
material fixes, confirming canonical screenshot fidelity, Read mode, responsive
reading order, and derived-state labeling. This is a full disposition, unlike
the earlier counting-studio F1-only verdict.

The Edge Playwright report and 15 retained captures in
`.impeccable/review/digit-sum-studio` cover 1366px, 900px, and 390px, plus 683px
CSS reflow: digit helpers, prepared map, exchange, result, billion/12-value/cycle
boundaries, inspector, keyboard, 44px targets, inspection pause/frame continuity,
invalid-input preservation, input synchronization, same-tab routing, and
system/saved reduced motion. The report passed with an empty console and zero
API writes. The native Windows computer-use entrypoint was unavailable; native
200% browser zoom remains unverified. The 683px captures establish CSS reflow
only.

The authorized existing-API addition created Medium, Resolved record
`36b926bd-cd93-4747-8f26-e540e41ed172`, source key
`minimum-swaps-to-sort-by-digit-sum`, with Sorting under Search & Ordering as
primary and Arrays secondary. Canonical code matches, 13 note bullets are saved,
and `record_initial_mistake: false` produced zero mistake events. All 47 unrelated
full API record hashes were preserved. Current totals are 48 records: 36 Resolved
and 12 Open. `.local/digit-sum-record.json` records title/`minSwaps`/bijection
search and Atlas inclusion; Atlas node selection was not checked. Independent
read-only SQLite inspection verified the status, 13 note rows, and zero events.

`.local/digit-sum-acceptance.json` records PASS against the actual local API on
port 8000 and browser: visible notes/Resolved status, canonical reference match,
specialized lesson, same-tab navigation, zero errors, and zero API writes during
acceptance. No export, commit, push, schema, or scheduler change applies. The
pre-existing shared button 0.98 press scale versus DESIGN.md's no-scale guidance
remains reported, unrepaired, and not canonized as a global rule.

## Direction contract — Deadline Heap and XOR Recovery

THESIS: Make exchanging a long course for a shorter one and recovering the next XOR value understandable without inventing source operations.

OWN-WORLD: Inherit graphite, IBM Plex Sans language, DM Mono data, cyan current state, violet structure, magenta rejection/removal and green committed results. These are Read-mode additions to the incumbent lesson shell.

STORY: Course Schedule III sorts by deadline, tests inclusive feasibility and exposes accept/replace/skip with actual negative heap keys; a separately labeled derived schedule stays committed during pending mutations. Decode XORed Array separates the computed next value from its later append.

FIRST VIEWPORT: Presets/playback precede the deadline-ordered course ribbon and heap, or the encoded/output ribbons and bit board. Current-operation ledgers follow the primary diagram on mobile before longer history. Custom Fields/JSON input and source start collapsed; diagrams pan locally.

FORM: Screenshot-grounded incumbent extension; no seed or comp applies. Signatures are removal/addition/heap replacement and bitwise XOR followed by a committed output cell. Duplicates retain course IDs only as teaching annotations; the heap stores durations, not IDs.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Deadline Heap and XOR Recovery completion and finish record

Recorded completion: 2026-10-19, Asia/Calcutta. The direction contract above is
implemented by `lessons/course-schedule-three/` and
`lessons/decode-xored-array/`, each with one canonical raw Python reference,
pure typed immutable trace, diagnostic presets, renderer, editor, and one
source-scoped LeetCode registry definition. Aliases are 630 /
`course-schedule-iii` and 1720 / `decode-xored-array`. The supplied Python is
displayed and simulated, never executed.

Course Schedule III accepts 1–12 duration/deadline rows with integer values
1–10,000, including duplicates. Stable deadline sorting, inclusive fit,
empty-heap short circuit, and strict longest-duration replacement follow the
source. Total changes precede heap pushes; replacement exposes removal, incoming
duration addition, and insertion separately. The heap displays actual negative
duration keys in one valid simulated layout, explicitly not `heapq` internals.
Stable original IDs and the feasible schedule are derived teaching annotations;
equal-duration ID choices are not unique. The previous committed witness remains
visible throughout pending acceptance and replacement.

Decode XORed Array accepts 1–16 encoded integers plus `first`, each in
0–100,000. The seed is known, future output stays unknown, calculation precedes
append, and the bit board retains the operands used before append. Its displayed
index is derived from the source's value iteration. Decoded output may exceed
100,000; the boundary example produces 131,071 on a 17-bit board.

Both lessons reuse `FieldsJsonInput`, `recovery-studios.css`, shared sequence and
operation primitives, Bklit legend, Kokonut tabs, and shared Motion controls.
`completeTrace` counts the full simulation before cloning and enforces the
12,000-frame cap without partial traces. Exact source focus and replacement/skip
or XOR/append jumps are retained. Fields/JSON modes synchronize; editing pauses
playback, invalid builds preserve the last applied trace, and opening the editor
or source preserves the frame. Same-tab routing is retained.

The shipped hierarchy agrees with the incumbent Read-mode world: graphite
surfaces, IBM Plex Sans language, DM Mono measurements, cyan current/pending
state, violet structure, magenta removal/rejection, and green committed results.
The primary ribbons precede the compact ledger and secondary witness/history or
bit board. Columns stack at 980px and below; wide diagrams and tables scroll in
their own keyboard-focusable regions. Text/symbol cues, readable 12px labels,
44px controls, collapsed custom/source inspection, and system/saved reduced
motion remain in use. No dependency, shipping raster, or global visual-system
change applies. `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json` were
preserved. The pre-existing shared button 0.98 press scale versus DESIGN.md's
no-scale guidance remains reported, unrepaired, and not canonized.

Final main verification passed 103 general checks with one expected optional
live-Atlas skip, all 82 visualizer tests, 71 backend tests, production build,
Ruff check, and Ruff formatting (57 files already formatted). The incumbent
bundle-size warning remains. `tests/frontend/deadline-xor.test.mjs` checks an
exhaustive subset-feasibility oracle and an independent bitwise XOR oracle,
actual operation timing, intermediate invariants, independent snapshots,
boundaries, exact source focus, registry scope, jumps, and semantic rendering.
The main detector ran once and returned `[]` in
`.impeccable/review/deadline-xor/detector.json`; it was not rerun.

`.impeccable/review/deadline-xor/browser-report.json` records PASS and 17 retained
captures at 1366px, 900px, and 390px, plus 683px CSS reflow. It covers initial,
mechanism, result, boundary, editor, and inspector states; keyboard operation;
44px targets; synchronized Fields/JSON input; editing pause; invalid-build trace
preservation; reference matching; same-tab routing; and system-emulated/saved
reduced motion. The console is empty and API writes are zero. Native Windows
computer-use was unavailable, so Edge Playwright supplied the disclosed browser
fallback. Native 200% browser zoom remains unverified; 683px is CSS reflow only.

The fresh independent reviewer returned full lesson-surface SHIP with no material
fixes in `.impeccable/review/deadline-xor/finish-review.md`, after inspecting all
17 captures. That verdict explicitly excludes the subsequently created records
and persisted notes; their separate acceptance is recorded below. Test results
were supplied evidence for that review, not independently rerun by the reviewer.

The authorized main workflow used the existing API with
`record_initial_mistake: false` to create two Resolved records with canonical
code and zero mistake events:

- Course Schedule III: `ceb5e615-0d7e-4a75-8447-e5b622df07fc`, Hard, Scheduling
  primary with Heaps and Sorting secondary; O(n log n) time and O(n) space;
  16 note bullets, including five edge-case bullets.
- Decode XORed Array: `c97e4f00-4f53-4e9f-8975-cb894c0b30bd`, Easy, Bit
  Manipulation primary with Arrays secondary; O(n) time, O(n) output space and
  O(1) beyond output; 13 note bullets, including four edge-case bullets.

`.local/deadline-xor-records.json` records PASS for both, canonical code matches,
title/code/notes search under Resolved, Atlas dataset inclusion, and preservation
of all 48 unrelated full-record hashes. Atlas node selection was not checked.
Totals are 50 records: 38 Resolved and 12 Open.
`.local/deadline-xor-acceptance.json` records PASS against the actual API plus
independent read-only SQLite persistence and browser checks: saved notes and
Resolved status visible, canonical reference match, specialized lesson selected,
same-tab navigation, zero API writes, and no errors. This workflow performed no
export, commit, push, schema, or scheduler change.

## Direction contract — 32-Bit Carry Workbench

THESIS: Make the incoming carry, sum-bit calculation, outgoing carry, result write and signed interpretation distinct; never replace the user's full adder with a different addition algorithm.

OWN-WORLD: Inherit the graphite Read-mode lesson shell, IBM Plex Sans explanation, DM Mono bits, cyan current column, violet input structure, magenta pending state and green committed writes.

STORY: The reader follows all 32 low-to-high columns, inspects the full-adder operands, watches one bit commit, then understands why an unsigned working word becomes a negative Python result. Input and boundary examples stay within −100…100.

FIRST VIEWPORT: Presets and shared playback precede the focused full-adder diagram and compact operation ledger. A locally scrolling 32-bit table follows; inspection pauses at the same frame. Mobile stacks the ledger and table, preserving source access and 44px controls.

FORM: Screenshot-grounded incumbent extension, no seed, QUALITY BAR card or approved comp required. The signature is separate carry-in/carry-out state and one committed result column; inspection is derived and never changes execution.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## 32-Bit Carry Workbench completion and finish record

Recorded completion: 2026-10-19, Asia/Calcutta. The final direction contract
above is implemented by `lessons/add-two-integers/`: canonical raw screenshot
Python, pure typed immutable trace, eleven presets, renderer/styles, editor,
and adapter. One source-scoped LeetCode registry definition provides `2235` and
`add-two-integers` aliases. The Python is displayed and simulated, never executed.
This is an ordinary incumbent Read-mode extension; no seed, separate QUALITY
BAR card, approved comp, or shipping raster applies.

Inputs are integers in −100…100. The trace retains all 32 low-to-high columns
and 196 frames: result/carry initialization, column entry, both bit reads,
sum-bit calculation, carry update, unsigned OR write, then sign check and
return. Captured carry-in remains separate from updated source carry-out;
unknown column fields are explicitly pending. BigInt internally preserves
Python sign-extending shifts and bitwise semantics without JavaScript signed
32-bit truncation; frame payloads remain ordinary numbers. Working `res` stays
in 0…2^32−1. The final return is `res` or `~(res ^ 0xFFFFFFFF)` and never mutates
that word; carry beyond bit 31 is not appended. Fixed-width time and space are
O(1); the generalized w-bit O(w) explanation is a follow-up only.

The focused full adder precedes the compact operation ledger, followed by the
inspectable semantic 32-bit table and signed-decode explanation. Columns stack
at 980px and below, with output boxes stacked at 560px. Wide bit rows scroll
locally with retained row labels. Derived inspection calls generic `onInteract`
to pause at the same frame; Follow active bit restores the active-column
viewport. Fields/JSON synchronize through `FieldsJsonInput`; editing pauses,
invalid builds retain the applied trace, and source/input inspection preserves
the frame. Exact source focus and bit/sign jumps remain available.

The artifact agrees with the incumbent graphite world, IBM Plex Sans language,
DM Mono bits and measurements, cyan current column, violet inputs, magenta
captured carry, and green committed writes. Bklit legend, Kokonut tabs, shared
Motion/reduced-motion behavior, 12px labels, 44px controls, collapsed input/source
inspection, and same-tab routing remain in use. No dependency, shipping raster,
or global style change applies. `PRODUCT.md`, `DESIGN.md`, and
`.impeccable/design.json` are preserved. The pre-existing shared button's 0.98
press scale conflicts with DESIGN.md's no-scale guidance; it remains reported,
unrepaired, and not canonized as a global rule.

Final main verification passed `npm run check` with 109 passes and one expected
optional live-Atlas skip, all 88 visualizer tests, the production build, 71
backend tests, Ruff check, and Ruff formatting (57 files already formatted).
The incumbent chunk-size warning remains. Six groups in
`tests/frontend/add-two-integers.test.mjs` cover 400 arithmetic cases (eleven
presets, 289 small signed pairs, and 100 seeded pairs), all eight full-adder
truth rows, source-assignment timing, unsigned/NOT semantics, carry chains,
independent snapshots, limits, exact source focus, parser/SSR behavior, and
source-scoped registry/jump wiring.

One initial self-QA pass, one readability-fix batch, and one confirmation pass
completed the bounded refinement. The main detector ran once and returned `[]`
in `.impeccable/review/bit-addition/detector.json`; it was not rerun. The fresh
independent reviewer returned full lesson-surface and registry SHIP with no
material fixes in `.impeccable/review/bit-addition/finish-review.md`, with
persistence, fidelity, ceiling, material_fixes, and keep sections, after opening
all ten captures named by the browser report. That review preceded record
creation and excludes saved records; its browser and test results were supplied
evidence, not independently rerun by the reviewer.

`.impeccable/review/bit-addition/browser-report.json` records PASS at 1366px,
900px, and 390px, plus 683px CSS reflow. Ten retained captures cover pending
carry, positive/negative/cancellation results, fields, inspector, and reduced
reflow. Interaction checks cover same-frame inspection pause, Follow active bit,
keyboard operation, 44px targets, input synchronization, invalid-build trace
preservation, editing pause, same-tab routing, canonical reference matching,
and system-emulated/saved reduced motion. The console is empty and API writes
are zero. Native Windows computer-use's `node_repl` entrypoint was unavailable,
so the disclosed Edge Playwright fallback supplied browser evidence. Native
200% browser zoom remains unverified; 683px establishes CSS reflow only.

After SHIP, the authorized main workflow used the existing API with
`record_initial_mistake: false` to create Easy, Resolved record
`ebbb8c71-96bc-4964-a4d8-98369b320a87`, source key `add-two-integers`, with
Bit Manipulation under Math & Bitwise primary. Canonical code matches; sixteen
note bullets include four edge cases. There are zero mistake events and
`why_missed` is blank. Saved time and space complexity are O(1) for 32 columns.

`.local/bit-addition-record.json` records PASS for title/code/note search under
Resolved, Atlas dataset inclusion, and preservation of all 50 unrelated full
API record hashes. Atlas node selection was not checked. Totals are 51 records:
39 Resolved and 12 Open. `.local/bit-addition-acceptance.json` records PASS
against the actual API, independent read-only SQLite persistence, and browser:
core/edge-case notes and status visible, specialized lesson selected in the
same tab, canonical reference match, returned result 17, no errors, and zero API
writes during acceptance. This separate main acceptance covers the persisted
record excluded from the finish-review verdict. No export, commit, push,
schema, or scheduler change applies.

## Direction contract — Divide Two Integers / Shift-and-Subtract Studio

THESIS: Explain division as descending shifted chunks, not repeated unit subtraction.
The saved Python remains the only source; separate subtraction and quotient writes.

OWN-WORLD: Inherit graphite, IBM Plex Sans, DM Mono measurements, cyan current
operations, violet bit structure, magenta rejected candidates, and green committed bits.

STORY: Inspect signs, compare a shifted divisor with the remaining magnitude,
subtract a fitting chunk, set its quotient bit, and apply the final sign.

FIRST VIEWPORT: Existing lesson shell and shared playback lead directly into a
wide shift-comparison diagram beside the compact source-state ledger. Below,
an inspectable 32-bit quotient rail and accepted-chunk table explain the result.
Inputs and code inspector retain their existing locations. Controls remain 44px;
mobile stacks panels and scrolls only wide data locally. The signature interaction
leaves the quotient unchanged after subtraction until its own source write occurs.

FORM: Code-led, narrow Read-mode extension of the incumbent lesson composition;
no seed or comp required. Signed 32-bit inputs, exact large shifted values,
overflow early return, and all 32 checks are explicit. Saved Python is never executed.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Finish record — Divide Two Integers / Shift-and-Subtract Studio — 2026-10-21

The shipped `lessons/divide-two-integers/` and source-scoped `29` /
`divide-two-integers` registry aliases implement this ordinary code-led Read
extension. The comparison/ledger, inspectable quotient rail, accepted-chunk
table, and signed return preserve the direction contract. Original signed
inputs remain distinct from mutable source magnitudes; separate subtraction,
quotient increment, and index decrement make pending writes explicit. BigInt
internally preserves Python semantics, while exact shifted candidates are
decimal strings in copied frame payloads. All 32 shifts remain present except
the two-frame overflow return. Twelve official/diagnostic presets are included;
saved Python is reference text and is never executed.

Source-grounded conventions are appended to `docs/visualizer-conventions.md`.
No new visual world, seed, comp, dependency, shipping raster, or system token
applies. Graphite, IBM Plex Sans interface language, DM Mono measurements,
cyan current comparison, violet bit structure/inspection, magenta rejection,
green committed bits, 980px/560px reflow, local data scrolling, and shared
reduced-motion controls remain incumbent. `PRODUCT.md`, `DESIGN.md`, and
`.impeccable/design.json` are preserved. The pre-existing shared `LessonButton`
0.98 press scale still conflicts with DESIGN.md's no-scale guidance; it is
reported, unrepaired, and not adopted as a rule.

Final main verification passed `npm run check` with 116 passes and one expected
optional live-Atlas skip, all 95 visualizer tests, the production build, 71
backend tests, Ruff check, and Ruff formatting (57 files already formatted).
The incumbent approximately 508KB visualizer chunk warning and two existing
backend deprecation warnings remain. Seven groups in
`tests/frontend/divide-two-integers.test.mjs` cover 774 arithmetic cases (12
presets, 600 small signed pairs, 42 boundary pairs, 120 seeded pairs), exact
2^62 shifts, assignment timing, signs/overflow/zero, independent snapshots,
source lines, counting before allocation, limits, parsing, SSR, registry/jumps,
and regression checks at every loop boundary.

Main QA completed two passes, followed by one reviewer-scoped correction and
recapture. The detector ran once and returned `[]`; it was not rerun.
`.impeccable/review/division/finish-review.md` records the independent full
review's `fix` disposition: null-current loop states incorrectly repeated
normalization instructions. Canvas now distinguishes loop preparation from
normalization and completed checks. The targeted regression and all fourteen
valid recaptures support the resolved finding in
`.impeccable/review/division/verdict.md`. Its SHIP disposition covers the scored
fix only; it is not a fresh full-surface SHIP verdict. Both reviews exclude
persisted records; supplied tests/interactions were not independently rerun.

`.impeccable/review/division/browser-report.json` records PASS at 1366px, 900px,
and 390px plus 683px CSS reflow. Fourteen retained captures include the earlier
eleven states and negative first/later loop entries and loop end. Checks cover
same-frame inspection pause, Follow active shift, keyboard operation, 44px
targets, Fields/JSON sync, invalid-build preservation, editing pause, same-tab
routing, canonical reference match, and system-emulated/saved reduced motion.
The console is empty; API writes are zero. Native computer-use's `node_repl`
entrypoint was unavailable, so headless Edge Playwright supplied the disclosed
fallback evidence. Native 200% browser zoom remains unverified; 683px is CSS
reflow evidence only.

After verification, the authorized main workflow used the existing API with
`record_initial_mistake: false` to create Medium, Resolved record
`90e892b3-efe2-481b-89a5-3423120f1be7`, source key `divide-two-integers`, with
Bit Manipulation under Math & Bitwise primary. Canonical code matches; eighteen
note bullets include six edge cases. Mistake events are zero and `why_missed`
is blank. `.local/division-record.json` records PASS for title/code/note search
under Resolved, Atlas dataset inclusion, and preservation of all 51 unrelated
full-record hashes. Totals are 52 records: 40 Resolved and 12 Open. Atlas node
clicks were not tested.

`.local/division-acceptance.json` records separate PASS against the actual API,
read-only SQLite persistence, and browser: status and notes visible, specialized
lesson selected in the same tab, canonical reference match, returned result 3,
no errors, and zero acceptance API writes. This acceptance covers the persisted
record excluded from the review verdicts. No export, commit, push, schema, or
scheduler change applies.
