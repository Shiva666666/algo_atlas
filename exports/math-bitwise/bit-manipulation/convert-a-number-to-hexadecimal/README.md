---
export_schema_version: 1
id: 1b9d5067-f7dd-4beb-9db8-24e10eebd76e
source: leetcode
source_key: convert-a-number-to-hexadecimal
slug: convert-a-number-to-hexadecimal
title: Convert a Number to Hexadecimal
url: https://leetcode.com/problems/convert-a-number-to-hexadecimal/
difficulty: Easy
status: Resolved
primary_subtag_id: eed2d54f-4047-5728-8e33-4d0004776eef
primary_path:
- math-bitwise
- bit-manipulation
taxonomy_ids: []
time_complexity: O(1) for 32-bit integers
space_complexity: O(1) for 32-bit integers
created_at: '2026-08-30T18:38:03.225251Z'
updated_at: '2026-08-30T18:38:03.225254Z'
mistake_events:
- id: 181edd03-19b2-488b-853d-ffde45aeae9d
  occurred_at: '2026-08-30T18:38:03.224796Z'
  observation: Solved on 2026-08-31 (Asia/Kolkata). Python solution recorded from
    the supplied screenshot.
  reason_ids: []
---

# Convert a Number to Hexadecimal

[Open on Leetcode](https://leetcode.com/problems/convert-a-number-to-hexadecimal/)

## Core insight

- Mask to 32 bits for two's-complement negatives, then extract one hexadecimal digit from each four-bit group.

## Approach

- Handle zero explicitly.
- Apply num &= 0xFFFFFFFF and build the digit mapping 0 through f.
- Prepend the digit for num & 15, then shift num right by four bits.
- Stop when no bits remain and return the accumulated string.

## Invariants

- Each iteration consumes the lowest four remaining bits; masking limits the result to at most eight hex digits.

## Edge cases

- Zero returns "0".
- Negative one returns "ffffffff".
- The signed 32-bit minimum returns "80000000".
