---
export_schema_version: 1
id: 588a7d5b-acff-4fb7-ba4e-6908f0af23dd
source: leetcode
source_key: maximal-square
slug: maximal-square
title: Maximal Square
url: https://leetcode.com/problems/maximal-square/
difficulty: Medium
status: Resolved
primary_subtag_id: 91d16774-9fac-50c0-9399-859ea4941656
primary_path:
- dynamic-programming
- 2d-and-grid-dp
taxonomy_ids:
- 344303c1-32ea-5183-81ca-ef93be3622bb
- ee20e1d8-5e6f-5798-aa4e-bc8701bdde07
time_complexity: O(m × n)
space_complexity: O(m × n)
created_at: '2026-08-28T03:07:24.049692Z'
updated_at: '2026-08-28T03:07:24.049697Z'
mistake_events:
- id: 991b676d-3d7e-431f-8e22-a18775713dd8
  occurred_at: '2026-08-28T03:07:24.051384Z'
  observation: Accepted, then simplified by letting min() handle zero neighbors and
    initializing the skipped boundaries directly.
  reason_ids:
  - 1c010780-c1de-5c7c-837d-535455ce3f36
  - d53eb82d-85df-518d-89ab-c22297fd7870
---

# Maximal Square

[Open on Leetcode](https://leetcode.com/problems/maximal-square/)

## Why I missed it

- The first row and first column were skipped by the recurrence loop, so they needed explicit initialization.
- Added a redundant condition requiring all three neighbors to be nonzero before applying the recurrence.

## Recognition signals

- The largest square ending at a cell depends only on its top, left, and top-left neighbors.

## Core insight

- For a 1-cell, its largest square side is 1 plus the minimum neighboring side; a zero neighbor naturally reduces it to a 1×1 square.

## Approach

- Convert the string matrix to integer DP values.
- Initialize the maximum from the first row and first column because the interior loop skips them.
- For each interior 1-cell, apply 1 + min(diagonal, top, left).
- Track the maximum side and return its square as the area.

## Invariants

- dp[i][j] is the side length of the largest all-1 square whose bottom-right corner is (i, j).

## Edge cases

- A single-cell matrix.
- All zeros.
- The only 1 lies in the first row or first column.
- A zero neighbor limits the current square to side length one.

## Follow-up

- Compress the DP to one row while preserving the previous diagonal value.
