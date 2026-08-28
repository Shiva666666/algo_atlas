---
export_schema_version: 1
id: e2f9972d-8f97-478b-80cc-2ce9f928cecb
source: leetcode
source_key: is-graph-bipartite
slug: is-graph-bipartite
title: Is Graph Bipartite?
url: https://leetcode.com/problems/is-graph-bipartite/
difficulty: Medium
status: Understood
primary_subtag_id: 08c05564-cd65-5b72-a179-d15e2e39edbe
primary_path:
- graphs-networks
- graph-traversal
taxonomy_ids:
- f868a303-b561-5a23-b3ce-84e24bfce62b
- 035e24d4-1f25-5fbd-a08a-dce65bfc8e81
time_complexity: O(V + E)
space_complexity: O(V)
created_at: '2026-08-27T19:49:12.706342Z'
updated_at: '2026-08-28T01:03:48.528614Z'
mistake_events:
- id: 552be431-11f7-42ba-a16f-704e519052b7
  occurred_at: '2026-08-27T19:49:12.706675Z'
  observation: The first attempt tied colors to BFS levels and did not safely handle
    disconnected components.
  reason_ids:
  - 1c010780-c1de-5c7c-837d-535455ce3f36
  - d378ef3e-bad0-56db-9112-3657bb936982
---

# Is Graph Bipartite?

[Open on Leetcode](https://leetcode.com/problems/is-graph-bipartite/)

## Why I missed it

- Tracked traversal level instead of preserving one color per vertex across the whole component.

## Recognition signals

- Every edge requires its endpoints to belong to opposite groups.

## Core insight

- Color an unvisited neighbor opposite the current node; reject an edge whose endpoints already share a color.

## Approach

- Start a traversal from every still-uncolored vertex.
- Seed either color.
- Color new neighbors with the opposite value.
- Stop on a same-color edge.

## Invariants

- Every processed edge joins opposite colors.

## Edge cases

- Disconnected graph.
- Isolated vertex.
- Odd cycle.
- Even cycle.

## Follow-up

- Recognize odd-cycle detection as the same invariant.
