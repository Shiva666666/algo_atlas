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
---

# Problem visualizer — graph lesson family

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
