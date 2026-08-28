---
export_schema_version: 1
id: c3fb0812-2501-45f7-a7b5-751d5ad451d8
source: atcoder
source_key: abc395-g
slug: abc395-g
title: Minimum Steiner Tree 2
url: https://atcoder.jp/contests/abc395/tasks/abc395_g
difficulty: Hard
status: Open
primary_subtag_id: 613a20fd-dd56-5b75-b466-cf2d5afac08a
primary_path:
- dynamic-programming
- bitmask-dp
taxonomy_ids:
- 344303c1-32ea-5183-81ca-ef93be3622bb
- 35905b52-a320-5d99-8d2c-e393540fbe7e
- 70ee08ed-e707-5c6a-a226-5b07f0ee5137
time_complexity: O(3^K N^2 + 2^K N^3)
space_complexity: O(2^K N + N^2)
created_at: '2026-08-27T19:49:12.666497Z'
updated_at: '2026-08-28T01:03:48.492072Z'
mistake_events:
- id: 0c7412a3-f22c-4fc5-a8a2-f4ed30a20233
  occurred_at: '2026-08-27T19:49:12.666950Z'
  observation: Needed intuition for the subset merge, root movement, and why query
    vertex t is a column rather than a mask bit.
  reason_ids:
  - 1c010780-c1de-5c7c-837d-535455ce3f36
  - 5dc59bfb-0187-53b9-a8ae-68970fb91a89
---

# Minimum Steiner Tree 2

[Open on Atcoder](https://atcoder.jp/contests/abc395/tasks/abc395_g)

## Why I missed it

- Tried to think about subsets of optional Steiner vertices instead of subsets of the at-most-eight fixed terminals.

## Recognition signals

- A very small terminal count K alongside a much larger graph suggests a terminal-mask state.
- The state must be connected and also expose an attachment vertex v.
- Many queries differ only by s and t, so fixed-terminal work should be reusable.

## Core insight

- DP[mask][v] is the cheapest connected graph containing every terminal in mask and the attachment vertex v.
- Two trees can merge only when they share the same v; shortest-path relaxation then moves v through arbitrary connector vertices.

## Approach

- Seed empty and singleton fixed-terminal states.
- For each mask, try proper submask splits that meet at the same root.
- Close the completed row with dense Dijkstra so optional connector vertices emerge without mask bits.
- For each possible s, build a second layer that carries s on exactly one side of every merge.
- Answer a query by reading the full fixed-terminal mask at column t.

## Invariants

- Every finite state is connected and contains exactly the required terminal set, plus its root.
- The query-specific side carries s exactly once.

## Edge cases

- Zero-weight edges and tied optimal trees.
- A nonterminal hub that is absent from the query but essential to the optimum.
- Costs require 64-bit totals.
- K=1 leaves no nontrivial fixed-terminal split.

## Follow-up

- Reconstruct predecessor edges for one query after the state transitions feel natural.
