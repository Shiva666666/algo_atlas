---
export_schema_version: 1
id: 2dbad318-797a-4996-a5ba-26f236e1dfd0
source: leetcode
source_key: subsets-ii
slug: subsets-ii
title: Subsets II
url: https://leetcode.com/problems/subsets-ii/
difficulty: Medium
status: Understood
primary_subtag_id: 1efc727e-a024-5b08-bb5c-1ac9d1c864be
primary_path:
- backtracking-combinatorics
- subsets
taxonomy_ids:
- 40bb7087-9862-5cad-8a94-b3dc441b47b5
- dd1d5cff-9466-546f-94c1-68b9af6fa9e2
time_complexity: O(n log n + n × unique subsets)
space_complexity: O(n) auxiliary + output
created_at: '2026-08-27T19:49:12.715623Z'
updated_at: '2026-08-28T01:03:48.534506Z'
mistake_events:
- id: 0e8e4473-d8cf-4978-b4ae-915bb8c17d3f
  occurred_at: '2026-08-27T19:49:12.715949Z'
  observation: A global seen set removed duplicates only after generating them.
  reason_ids:
  - 51286a52-5e07-5d2d-9618-1fcee2925c0c
  - 6e5b1f0e-1c39-5c5f-9031-44b8d2e7141e
---

# Subsets II

[Open on Leetcode](https://leetcode.com/problems/subsets-ii/)

## Why I missed it

- The duplicate condition was treated globally instead of relative to one recursion level.

## Recognition signals

- Equal sorted values create identical sibling branches, but equal values at deeper levels represent additional copies.

## Core insight

- Same value plus same recursion level means skip; same value at a deeper level is allowed.

## Approach

- Sort so duplicate candidates are adjacent.
- Record the current path immediately.
- At each level, skip an equal value unless it is the first candidate for that level.
- Choose, recurse with the next index, and remove.

## Invariants

- Chosen indices strictly increase and no recursion level starts two branches with the same value.

## Edge cases

- All values equal.
- No duplicates.
- Empty input.
- Several duplicate groups.

## Follow-up

- Relate the number of visited states to the number of unique subsets rather than only 2^n.
