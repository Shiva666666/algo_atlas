# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Algo Atlas is for a solo coder who wants to turn solved problems and past mistakes into a dependable study system. The primary job is to capture a mistake quickly, classify it, find recurring weaknesses, revisit the relevant solution, and publish a readable record when needed.

## Product Purpose

Algo Atlas is a local-first knowledge atlas for algorithm practice. It connects mistakes, taxonomy, solution notes, and visual traces so the user can move from “what went wrong?” to “what pattern should I recognize next time?” Success means the collection becomes easier to search, study, and act on as it grows.

## Positioning

The product treats algorithm practice as an interconnected mistake system rather than a streak, leaderboard, or generic note archive. The atlas, taxonomy, analytics, editor, visualizer, and export workflow all describe the same local body of learning evidence.

## Operating Context

The user logs and edits problems after practice sessions, reviews analytics and taxonomy to choose what to study, explores algorithm state in the visualizer, and uses Settings & Sync to inspect exports, publish them through Git, or restore local data. The app runs as a desktop-oriented web interface with responsive mobile access.

## Capabilities and Constraints

- SQLite is the local source of truth; there is no account system or cloud database.
- Problem records include taxonomy, notes, solution code, history, and review signals. Stored solution code is displayed and studied, not executed by the app.
- JSON export remains deterministic and readable. Existing backend endpoints, database schema, export format, and application data flow must remain stable during visual refinement.
- Git publishing must export the local database state, commit the intended export files, and push the resulting commits without sweeping unrelated staged changes into the publication.
- Existing React, TypeScript, CSS, Python, and Vite architecture remains authoritative.

## Brand Commitments

Keep the name “Algo Atlas,” the dark technical knowledge-constellation identity, and the existing social-preview asset and metadata. Cyan is the action signal, violet describes navigation and relationships, and domain colors remain recognizable but restrained. Product language is direct, useful, and grounded in the user’s own data.

## Evidence on Hand

The repository contains the working local database application, route implementations, visualizers, export and Git publishing code, Python tests, and the current social-preview asset. No testimonials, external benchmarks, customer claims, or social proof are available; future work must not fabricate them.

## Product Principles

1. Put the next learning task ahead of decorative explanation.
2. Turn errors into structured, searchable evidence.
3. Preserve local ownership and make publication explicit.
4. Keep relationships and algorithm state explainable.
5. Improve the interface without changing trusted data behavior.

## Accessibility & Inclusion

Core workflows must remain keyboard accessible, maintain visible focus, respect reduced-motion preferences, support browser zoom, and provide mobile touch targets of at least 44px.
