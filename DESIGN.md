---
name: Algo Atlas
description: A restrained dark instrument for mapping algorithm mistakes and recurring patterns.
colors:
  action-cyan: "#37d9ff"
  atlas-violet: "#9b8cff"
  signal-magenta: "#f06cae"
  success: "#4fd1a1"
  warning: "#f1b85b"
  danger: "#ff6b7a"
  canvas: "#080b10"
  surface: "#10151d"
  surface-raised: "#151b25"
  border: "#293140"
  text-primary: "#eef4fb"
  text-secondary: "#a9b4c2"
  text-muted: "#778394"
typography:
  display:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "clamp(1.5rem, 2.4vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.005em"
  label:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
  code:
    fontFamily: "DM Mono, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action-cyan}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Algo Atlas

## Overview

**Creative North Star: "The Cartographer’s Instrument"**

Algo Atlas should feel like a focused instrument for working with a living map: dark, precise, data-rich, and calm enough for long study sessions. The interface keeps the existing cyan-and-violet knowledge-constellation identity, but moves hierarchy, typography, and task state ahead of atmospheric decoration.

This is an operate surface, not a promotional site. Layouts are dependable, controls are explicit, and depth is communicated mostly through tonal surfaces and relationships. Grids and restrained light effects appear only where they explain a graph, an algorithm, or current state.

**Key Characteristics:**

- Graphite surfaces with crisp tonal separation.
- IBM Plex Sans for interface language; DM Mono only for code and compact measurements.
- Cyan for the primary next action, violet for structure and relationships.
- Dense enough for technical work, never smaller than a readable functional floor.
- Flat, purposeful components with visible state and minimal ornament.

## Colors

The palette uses cold graphite neutrals with a rare electric cyan action voice and a quieter violet relationship voice. Magenta and semantic colors communicate trace or state, not decoration.

### Primary

- **Action Cyan:** Reserved for the screen’s primary action, focus emphasis, and selected controls.

### Secondary

- **Atlas Violet:** Navigation, taxonomy relationships, and visualization structure.
- **Signal Magenta:** Error patterns, selected trace evidence, and deliberate contrast inside visualizations.

### Neutral

- **Night Canvas:** Application background and the deepest canvas plane.
- **Graphite Surface:** Standard panels and grouped content.
- **Raised Graphite:** Interactive or elevated tonal layer.
- **Cartography Line:** Borders, dividers, and table structure.
- **Primary Ink:** Main text on dark surfaces.
- **Secondary Ink:** Supporting copy and metadata.
- **Muted Ink:** Non-critical context; never used for required instructions.

### Named Rules

**The Rare Current Rule.** Cyan identifies the next action or active state; it does not wash entire sections.

**The Semantic Light Rule.** Glow and grids are permitted only when they encode graph, focus, playback, or algorithm state.

## Typography

**Display Font:** IBM Plex Sans (with Segoe UI and sans-serif fallbacks)

**Body Font:** IBM Plex Sans (with Segoe UI and sans-serif fallbacks)

**Label/Mono Font:** DM Mono (with Consolas and monospace fallbacks)

**Character:** IBM Plex Sans supplies a clear, engineered rhythm without making the interface feel sterile. DM Mono marks content that is intrinsically code, a timestamp, a metric, or a compact technical identifier.

### Hierarchy

- **Display** (600, responsive 36–72px, 1.02): Atlas title moments and no more than one dominant heading per screen.
- **Headline** (600, responsive 24–36px, 1.15): Route titles and major analytical findings.
- **Title** (600, 16px, 1.3): Panel and form-section titles.
- **Body** (400, 16px, 1.6): Explanations, notes, empty states, and reading content; prose is capped near 70 characters.
- **Label** (600, 12px, 0.04em): Controls and concise metadata; functional text never drops below 12px.
- **Code** (400, 13px, 1.55): Source, traces, hashes, counts, and technical metadata only.

### Named Rules

**The Instrument Label Rule.** Uppercase labels are short, infrequent, and never substitutes for a clear heading.

## Layout

Desktop uses a persistent side rail and top action bar around a flexible content canvas. Major route content uses a 4px-based spacing system with tight 8–12px relationships inside controls, 16–24px between related groups, and 32px or more between major regions. Analytical layouts may use multiple columns only when the groups have distinct priority; equal-weight card walls are avoided.

At intermediate widths, secondary columns collapse below the primary task and tables preserve their header context. At phone widths, the side rail becomes a bottom navigation, content becomes a single column, persistent actions stay reachable, and interactive targets are at least 44px. The atlas and algorithm canvases remain spatial surfaces but their controls reflow independently.

## Elevation & Depth

The system is flat by default. Canvas, surface, and raised-surface tones establish depth, with one-pixel borders for containment. Shadows appear only on floating overlays such as the command palette or when a transient layer must sit above content; panels do not combine heavy borders, blur, glow, and shadow.

### Named Rules

**The Tonal Layer Rule.** Prefer one tonal step to decorative glass or ambient blur.

## Shapes

Corners are compact and tool-like: 4px for tags and small controls, 6px for buttons and fields, and 8px for panels or overlays. Pills are reserved for status, filters, and compact binary choices. Borders are single-pixel and low-contrast until focus, selection, or error state gives them meaning.

## Components

### Buttons

- **Shape:** Compact rounded rectangle (6px) with a 40px desktop height and 44px mobile target.
- **Primary:** Cyan fill, dark text, semibold label, and one per action cluster.
- **Hover / Focus:** A modest tonal shift on hover and a two-pixel cyan focus ring with offset; no scale or glow flourish.
- **Secondary / Ghost:** Raised graphite or transparent surfaces with clear border and text contrast.

### Chips

- **Style:** Small rounded tags (4px or pill only for state) with readable 12px labels.
- **State:** Selection changes both border and fill so color is not the only cue.

### Cards / Containers

- **Corner Style:** Restrained 8px radius.
- **Background:** Graphite tonal layers.
- **Shadow Strategy:** Flat at rest; overlays only.
- **Border:** One cartography line when containment is needed.
- **Internal Padding:** 16px compact, 24px standard, 32px for primary regions.

### Inputs / Fields

- **Style:** Dark canvas fill, crisp border, 6px radius, and 40px minimum height.
- **Focus:** Cyan border and visible outer focus ring.
- **Error / Disabled:** Error uses danger color plus explanatory text; disabled controls reduce contrast without becoming unreadable.

### Navigation

Navigation uses one icon family, IBM Plex Sans labels, and a cyan edge/fill cue for the active route. Desktop keeps labels visible; phone uses a five-destination bottom bar with 44px targets and accessible names.

### Atlas and Visualizer Canvases

The functional grid is scoped to the canvas. Controls and trace panels use the same surface, type, and state rules as the rest of the product; side-tab accents are replaced by full edges, tonal fills, or top rules that describe grouping without implying a browser tab.

## Do's and Don'ts

### Do:

- **Do** make the primary learning action and current state obvious at a glance.
- **Do** use IBM Plex Sans for interface hierarchy and reserve DM Mono for code or measurements.
- **Do** use the shared 4px spacing scale and 40px/44px control floors.
- **Do** preserve grids and restrained glow when they communicate graph or algorithm state.
- **Do** show loading, empty, error, pending, success, focus, disabled, and reduced-motion states clearly.

### Don't:

- **Don't** add decorative global grids, blanket glassmorphism, or atmospheric blur to ordinary panels.
- **Don't** use tiny functional labels, repeated eyebrows, or all-caps copy as the main hierarchy.
- **Don't** give every analytical panel equal visual weight or nest cards only to create spacing.
- **Don't** use side-tab border accents, multiple competing primary actions, or broad rule suppressions.
- **Don't** change data behavior, export shape, or the existing social-preview identity during UI refinement.
