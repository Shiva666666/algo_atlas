---
export_schema_version: 1
id: 5071447f-ae98-4516-a042-75dd156636fa
source: leetcode
source_key: longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit
slug: longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit
title: Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit
url: https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/
difficulty: Medium
status: Understood
primary_subtag_id: 9d2f9aa8-4194-5738-91a7-e6cb256b3781
primary_path:
- linear-structures
- queues-and-deques
taxonomy_ids:
- a99b4f1f-c5bd-5b5c-901c-8810700e227c
- 3335aafe-6ac1-5ade-bd78-3e038e206c3c
- b0652ae3-41f7-5430-884a-13ba1fb5a6bd
time_complexity: O(n)
space_complexity: O(n)
created_at: '2026-08-27T19:49:12.725008Z'
updated_at: '2026-08-28T01:03:48.540203Z'
mistake_events:
- id: 18381b1c-06c0-4fa2-b927-e6de9047f58e
  occurred_at: '2026-08-27T19:49:12.725788Z'
  observation: Needed to see why both a minimum deque and maximum deque are required
    while both window ends move.
  reason_ids:
  - 5b8bba84-1b4b-5a1c-ba66-a93cc6d71563
  - 6e5b1f0e-1c39-5c5f-9031-44b8d2e7141e
---

# Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit

[Open on Leetcode](https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/)

## Why I missed it

- A running maximum or minimum cannot be repaired in O(1) when the value leaving from the left was the extreme.

## Recognition signals

- A sliding window repeatedly needs its current minimum and maximum while elements expire from the left.

## Core insight

- Keep only values that still have a chance to become an extreme: decreasing indices for max, increasing indices for min.

## Approach

- Expand the right edge.
- Remove smaller, older candidates from the max-deque back and larger, older candidates from the min-deque back.
- While the two fronts differ by more than limit, move left and expire matching fronts.
- Record the valid window length.

## Invariants

- Deque indices remain inside the window and ordered by arrival; deque values remain monotonic.

## Edge cases

- limit is zero.
- All values equal.
- A singleton.
- A large spike splits duplicate blocks.

## Follow-up

- Reuse the two-deque component for any window constrained by a range.
