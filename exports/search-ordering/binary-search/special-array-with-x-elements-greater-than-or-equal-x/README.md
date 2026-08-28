---
export_schema_version: 1
id: 589f3150-d3cb-4218-8475-ce24f7f9e168
source: leetcode
source_key: special-array-with-x-elements-greater-than-or-equal-x
slug: special-array-with-x-elements-greater-than-or-equal-x
title: Special Array With X Elements Greater Than or Equal X
url: https://leetcode.com/problems/special-array-with-x-elements-greater-than-or-equal-x/
difficulty: Easy
status: Understood
primary_subtag_id: 539ba9fe-cbf9-5199-bc70-cbf4767d39e3
primary_path:
- search-ordering
- binary-search
taxonomy_ids:
- b0652ae3-41f7-5430-884a-13ba1fb5a6bd
- dd1d5cff-9466-546f-94c1-68b9af6fa9e2
time_complexity: O(n log n)
space_complexity: O(1)
created_at: '2026-08-27T19:49:12.687343Z'
updated_at: '2026-08-28T01:03:48.508844Z'
mistake_events:
- id: bd3c343d-ccd3-4bbc-abfa-b737db2df893
  occurred_at: '2026-08-27T19:49:12.687677Z'
  observation: The search could repeat the same midpoint and assumed x had to be present
    in the array.
  reason_ids:
  - 1c010780-c1de-5c7c-837d-535455ce3f36
  - 51286a52-5e07-5d2d-9618-1fcee2925c0c
---

# Special Array With X Elements Greater Than or Equal X

[Open on Leetcode](https://leetcode.com/problems/special-array-with-x-elements-greater-than-or-equal-x/)

## Why I missed it

- Searched array values instead of the answer range 0 through n and used a bound update that did not guarantee progress.

## Recognition signals

- x is defined by a count, so it may not appear in nums.
- count(nums >= x) is monotonic as x grows.

## Core insight

- Find the largest x with count(nums >= x) >= x, then verify equality.

## Approach

- Search candidate answers from 0 to n.
- Count qualifying values at the midpoint.
- Use boundary updates that strictly shrink the interval.
- Verify exact equality at the final boundary.

## Invariants

- Candidates larger than the right bound cannot satisfy the count condition.

## Edge cases

- All zeros.
- The valid x is absent from nums.
- The monotonic boundary exists but the final count is not equal to x.

## Follow-up

- Compare with sorting plus a linear scan.
