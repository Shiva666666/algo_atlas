---
export_schema_version: 1
id: 0b24f98f-7529-415a-9488-54510c7058e2
source: lintcode
source_key: '33'
slug: n-queens
title: N-Queens
url: https://www.lintcode.com/problem/33/
difficulty: Medium
status: Resolved
primary_subtag_id: 40bb7087-9862-5cad-8a94-b3dc441b47b5
primary_path:
- backtracking-combinatorics
- constraint-search
taxonomy_ids:
- 035e24d4-1f25-5fbd-a08a-dce65bfc8e81
time_complexity: O(n * n!)
space_complexity: O(n^2) auxiliary; output excluded
created_at: '2026-08-30T18:38:03.123483Z'
updated_at: '2026-08-30T18:38:03.123487Z'
mistake_events:
- id: 3345b6d0-09da-4373-9d13-adf32b007e08
  occurred_at: '2026-08-30T18:38:03.130409Z'
  observation: Solved on 2026-08-31 (Asia/Kolkata). Python solution recorded from
    the supplied screenshot.
  reason_ids: []
---

# N-Queens

[Open on Lintcode](https://www.lintcode.com/problem/33/)

## Core insight

- Place one queen per row; occupied columns and diagonals give constant-time conflict checks.

## Approach

- Backtrack row by row and try each column.
- Reject occupied columns or diagonals identified by row - column and row + column.
- Place the queen, recurse, then undo every set update and the appended row.
- Copy the completed board when all n rows are filled.

## Invariants

- Each previous row has exactly one queen; col, diag1, and diag2 represent precisely the current partial board.

## Edge cases

- n = 1 has one solution; n = 2 and n = 3 have none.
