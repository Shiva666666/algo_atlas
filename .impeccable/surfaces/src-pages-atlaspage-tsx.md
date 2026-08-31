---
slug: "src-pages-atlaspage-tsx"
primary_target: "src/pages/AtlasPage.tsx"
related_targets: ["src/atlas", "tests/atlas.test.mjs", "tests/spatial.test.mjs"]
---

# Spatial study network

Mode: Operate — explore a classification or problem, then open it in the library.

## Approved direction

The user's 2026-08-31 implementation plan replaces the rejected constellation.
Preserve the dark Algo Atlas identity, fonts, taxonomy colors, full viewport
below the app bar, local-first ownership, and Bklit/Kokonut/Motion controls.
The Sketchfab neurons reference establishes spatial qualities only; no model
is embedded, downloaded, or imitated with anatomical textures.

THESIS: real study relationships should be explorable in space and readable in 2D.
OWN-WORLD: a calm dark study instrument with softly lit matte objects, not stars.
STORY: My study network → inspect a relationship → open the exact library selection.
FIRST VIEWPORT: the network occupies the screen; controls are optional edge overlays.
FORM: user-approved implementation plan; no new concept roll or mockup was requested.

## Layout and interaction

Graph relationships/filtering contain no coordinates. The views share stable IDs,
not positions.

- 3D: deterministic seeded d3-force-3d simulation in a worker. Positions and bounds
  are cached by sorted topology identity; request ID plus identity reject stale
  messages. The serialized request contains only nodes/links. Domains form loose
  volumetric neighborhoods; patterns are anchored near actual connected problems.
- All nodes are softly lit spheres with modest size differences. Every curved strand
  is an actual edge. Shared-pattern links are subdued until an endpoint is active.
  No orbit rings, particles, biological textures, or invented junctions.
- Oblique overview; rotate, pan, zoom, explicit Fit map. Hover and search never
  restart layout. Saved camera pose includes final damped movement.
- Domain labels use measured text width and collision-aware alternative placements.
  Hover/focus or close zoom reveals other labels. 2D and List provide complete
  keyboard access when labels are intentionally hidden.
- 2D: independent open domain groups, two columns on wide desktops and one on
  narrower screens. Techniques branch left-to-right to wrapped problem labels.
  Label boxes reserve space; paths avoid neighboring labels. Pattern links appear
  only when a related endpoint is active.
- Readable default is 100%, not fit-to-everything. Fit map is an explicit overview
  of visible-node bounds. Read labels returns to the readable start.
- 2D supports dragging, wheel/pinch zoom, buttons, keyboard pan/zoom/reset and
  auto-reveals offscreen keyboard-focused nodes. Drag suppresses navigation.
  Each view preserves its camera when switching.
- Study scope shows logged problems and their classifications/tags. All topics
  reveals unused taxonomy. Filters change visibility, not stable positions.
- Search, domain rail, details and accessible List are retained. WebGL failure
  keeps 2D/List accessible. Motion respects system and local reduced-motion settings.

## Navigation and truth

Domains use main_id; techniques use subtag_id; patterns/custom tags use taxonomy_id;
problems use problem_id. IDs remain unchanged and encoded with URLSearchParams.
The library resolves exact problem selection through its existing detail endpoint.
Counts come from actual problem relationships, never visual weights. Distance
does not represent difficulty. No backend, records, statuses, solutions or exports
are changed by the redesign.

## Verification

Automated: deterministic/order-independent/metadata-independent layouts, substantial
depth, non-collapsing front/side/top/oblique projections, real edges, scope filtering,
cloneable worker messages, stale-result guards, label bounds, long tags, filtered
2D overview, wheel/pinch anchoring, all emitted node destinations, offline and live
library selections, and a synthetic 1,500-problem layout.

Browser review used the actual local app at 1920×1080, 1366×768 and 390×844.
Both views, manual orbit positions near 0/45/90/180 degrees, pan/wheel zoom,
reset, view switching/camera restoration, overlays, search/status/empty states,
keyboard view switching/pan, Tab/arrow node traversal, Enter activation, click
navigation and drag-without-navigation were
exercised. SVG text bounds fit their rectangles at desktop and mobile sizes.
A separate development-only preview rendered 240 synthetic problems and injected
WebGL-unavailable/empty-study conditions without touching records.

Batched review fixes: worker serialization, brighter local strands, larger mobile
objects, clipping behind controls, wrapped domain counts, long tag spacing,
filtered overview bounds, memoized renderer accessors, final camera pose capture,
hover-label grace period and pinch midpoint preservation.

Evidence: .impeccable/review/spatial-network/ includes desktop/mobile/laptop captures,
manual rotations, and large-graph/fallback captures. Rotation names describe
manual target angles; exact front/side/top projections are covered by unit tests.
Browser-level zoom and physical multitouch were not successfully exercised by this
runner and remain manual acceptance checks. HMR produced transient module/Hook
warnings while edits were in progress; the final clean reload has no new warnings
or errors. All 22 Atlas tests (including every live node destination), 10 existing
visualizer tests, TypeScript/production build and the source detector pass.
Independent final visual review: ship. Its one mid-transition tab-indicator capture
was replaced with a settled capture and confirmed. The Impeccable review informed
contrast, label spacing, viewport clipping and touch-target refinements.
No publication or migration was performed.
