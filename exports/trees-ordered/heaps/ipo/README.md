---
export_schema_version: 1
id: 751b821a-431c-423c-8a80-02b4224d8e15
source: leetcode
source_key: ipo
slug: ipo
title: IPO
url: https://leetcode.com/problems/ipo/
difficulty: Hard
status: Understood
primary_subtag_id: c5cbf419-ebc2-5e03-bc27-101ffe2d0199
primary_path:
- trees-ordered
- heaps
taxonomy_ids:
- be122f4c-13a6-563d-a0a4-ed61bccca963
- dd1d5cff-9466-546f-94c1-68b9af6fa9e2
time_complexity: O(n log n + k log n)
space_complexity: O(n)
created_at: '2026-08-27T19:49:12.733886Z'
updated_at: '2026-08-28T01:03:48.546108Z'
mistake_events:
- id: 76c2e158-c309-4e53-987b-7cf72c64c261
  occurred_at: '2026-08-27T19:49:12.734346Z'
  observation: A single profit heap repeatedly popped and reinserted the same unaffordable
    project.
  reason_ids:
  - 51286a52-5e07-5d2d-9618-1fcee2925c0c
  - 6e5b1f0e-1c39-5c5f-9031-44b8d2e7141e
---

# IPO

[Open on Leetcode](https://leetcode.com/problems/ipo/)

## Why I missed it

- One heap was asked to answer two incompatible orderings: affordability by capital and desirability by profit.

## Recognition signals

- Choices unlock over time according to one key, but the greedy choice uses another key.

## Core insight

- Move every newly affordable project from a capital ordering into a maximum-profit ordering, then take the best available profit.

## Approach

- Order locked projects by required capital.
- For each round, unlock every project affordable with current w.
- Stop if the profit structure is empty.
- Choose its maximum and add that profit to w.

## Invariants

- The profit structure contains all and only affordable unchosen projects.

## Edge cases

- Nothing is initially affordable.
- All projects are initially affordable.
- k exceeds the number of useful projects.
- Several projects share a capital requirement.

## Follow-up

- State the exchange argument: a larger available profit cannot reduce future options.
