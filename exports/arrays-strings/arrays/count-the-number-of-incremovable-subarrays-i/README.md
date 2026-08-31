---
export_schema_version: 1
id: b72d8fc7-6a98-4508-9ac3-cdfd24f39ff1
source: leetcode
source_key: count-the-number-of-incremovable-subarrays-i
slug: count-the-number-of-incremovable-subarrays-i
title: Count the Number of Incremovable Subarrays I
url: https://leetcode.com/problems/count-the-number-of-incremovable-subarrays-i/
difficulty: Easy
status: Understood
primary_subtag_id: b0652ae3-41f7-5430-884a-13ba1fb5a6bd
primary_path:
- arrays-strings
- arrays
taxonomy_ids:
- dab87cfe-eb0e-586e-a85c-dab2f60e1d54
time_complexity: O(n)
space_complexity: O(1)
created_at: '2026-08-29T18:51:46.817692Z'
updated_at: '2026-08-31T13:15:07.225293Z'
mistake_events:
- id: 590a1a67-961d-48f4-b482-ff62fa54f789
  occurred_at: '2026-08-29T18:51:46.833062Z'
  observation: Could not figure out the optimal solution; saved the brute-force approach
    for later review.
  reason_ids:
  - 51286a52-5e07-5d2d-9618-1fcee2925c0c
  - 5b8bba84-1b4b-5a1c-ba66-a93cc6d71563
---

# Count the Number of Incremovable Subarrays I

[Open on Leetcode](https://leetcode.com/problems/count-the-number-of-incremovable-subarrays-i/)

## Why I missed it

- Enumerated every removed subarray and rebuilt the remainder instead of counting compatible increasing prefix/suffix boundaries.

## Recognition signals

- Removing one contiguous middle segment leaves only a prefix and a suffix.
- Both retained sides must be strictly increasing, and their boundary values must satisfy prefix_last < suffix_first.
- As the suffix start moves left, the compatible prefix pointer only needs to move left.

## Core insight

- Build the maximal increasing prefix, sweep an increasing suffix from right to left, and count all removal starts once the prefix/suffix bridge is valid.

## Approach

- Move i right to the end of the longest strictly increasing prefix.
- If i reaches n - 1, return n * (n + 1) // 2 because every non-empty subarray is removable.
- Initialize ans = i + 2 to count valid removals that end at n - 1.
- Move j left while nums[j:] remains strictly increasing.
- For each j, retreat i while nums[i] >= nums[j] so the retained prefix joins the suffix strictly.
- Add i + 2: removal start can be any index from 0 through i + 1.

## Invariants

- nums[0:i + 1] and nums[j:n] are strictly increasing.
- After the bridge loop, i < 0 or nums[i] < nums[j].
- i and j only move left during the suffix sweep, so their total movement is linear.

## Edge cases

- The whole array is already strictly increasing.
- The array is strictly decreasing.
- No prefix element can connect to the current suffix, so i becomes -1.
- A single-element array.

## Follow-up

- Replay the dedicated 2D trace and connect each highlighted rule to the matching Python line.
