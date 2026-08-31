---
export_schema_version: 1
id: af76c9e8-ad95-4030-8525-faf1d04e3c13
source: leetcode
source_key: coin-change-ii
slug: coin-change-ii
title: Coin Change II
url: https://leetcode.com/problems/coin-change-ii/
difficulty: Medium
status: Resolved
primary_subtag_id: 1e1f6ca6-3d54-5730-ad86-cbc49073b258
primary_path:
- dynamic-programming
- knapsack
taxonomy_ids:
- 035e24d4-1f25-5fbd-a08a-dce65bfc8e81
- 61519ac5-0946-538e-b0b5-376fc03a78b3
time_complexity: O(n * (amount + 1))
space_complexity: O(n * (amount + 1)); n = len(coins)
created_at: '2026-08-30T18:38:03.188481Z'
updated_at: '2026-08-30T18:38:03.188484Z'
mistake_events:
- id: f91968cc-ecf4-4d99-8307-0df45b982932
  occurred_at: '2026-08-30T18:38:03.191121Z'
  observation: Solved on 2026-08-31 (Asia/Kolkata). Python solution recorded from
    the supplied screenshot.
  reason_ids: []
---

# Coin Change II

[Open on Leetcode](https://leetcode.com/problems/coin-change-ii/)

## Core insight

- Memoize (coin index, accumulated amount); taking a coin keeps its index, while skipping advances the index.

## Approach

- Return 1 when the accumulated amount equals the target.
- Return 0 after overshooting or exhausting the available denominations.
- Reuse cached states; otherwise add the take-current-coin and skip-current-coin branches.
- Start from dfs(0, 0).

## Invariants

- Coin indices never move backward, so different orderings of the same combination are not counted twice.

## Edge cases

- Amount zero has one combination: use no coins.
- An unreachable amount has zero combinations.
