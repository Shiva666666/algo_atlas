---
version: 1
slug: "src-features-visualizers-problemvisualizerpage-tsx"
primary_target: "src/features/visualizers/ProblemVisualizerPage.tsx"
related_targets: ["src/features/visualizers/components/TraversalPrimitives.tsx"]
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
