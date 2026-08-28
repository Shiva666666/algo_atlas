---
export_schema_version: 1
id: b6b055cb-2349-473f-bf0e-5cc80879048e
source: leetcode
source_key: minimum-falling-path-sum
slug: minimum-falling-path-sum
title: Minimum Falling Path Sum
url: https://leetcode.com/problems/minimum-falling-path-sum/
difficulty: Medium
status: Understood
primary_subtag_id: 91d16774-9fac-50c0-9399-859ea4941656
primary_path:
- dynamic-programming
- 2d-and-grid-dp
taxonomy_ids:
- 61519ac5-0946-538e-b0b5-376fc03a78b3
- 344303c1-32ea-5183-81ca-ef93be3622bb
- ee20e1d8-5e6f-5798-aa4e-bc8701bdde07
time_complexity: O(rows × columns)
space_complexity: O(rows × columns)
created_at: '2026-08-27T19:49:12.697014Z'
updated_at: '2026-08-28T01:03:48.519572Z'
mistake_events:
- id: 4064718e-0577-4412-b8ee-263bcbd05adc
  occurred_at: '2026-08-27T19:49:12.697353Z'
  observation: Needed a clear top-down state, base row, and the three legal next pointers.
  reason_ids:
  - 1c010780-c1de-5c7c-837d-535455ce3f36
  - d53eb82d-85df-518d-89ab-c22297fd7870
---

# Minimum Falling Path Sum

[Open on Leetcode](https://leetcode.com/problems/minimum-falling-path-sum/)

## Why I missed it

- The recurrence was easier to state than the pointer bounds and row/column order.

## Recognition signals

- Movement is acyclic from one row to the next and each cell has only three possible continuations.

## Core insight

- State means the minimum sum starting at one cell; the last row is the base case.

## Approach

- Seed the last row with its own values.
- Move upward and read only down-left, down, and down-right cells that exist.
- Add the current cell to the cheapest child.
- Take the minimum value in the top row.

## Invariants

- The entire child row is resolved before a parent row uses it.

## Edge cases

- Single cell.
- Negative values.
- Left and right columns have only two legal children.

## Follow-up

- Compress space to one row after the 2D state is intuitive.
