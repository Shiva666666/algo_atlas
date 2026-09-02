---
export_schema_version: 1
id: c5e4f548-7943-4ddf-b26a-1d2b366e5763
source: leetcode
source_key: weighted-word-mapping
slug: weighted-word-mapping
title: Weighted Word Mapping
url: https://leetcode.com/problems/weighted-word-mapping/description/
difficulty: Easy
status: Resolved
primary_subtag_id: b982f2f2-cab6-50cf-8cb7-56825e9fd2b4
primary_path:
- arrays-strings
- strings
taxonomy_ids: []
time_complexity: O(C + m²) worst-case; O(C + m) with join
space_complexity: O(m) auxiliary + output
created_at: '2026-09-02T17:25:47.620037Z'
updated_at: '2026-09-02T17:25:47.620044Z'
mistake_events:
- id: 09577c5d-5e01-46d4-ad6e-76977d9207ad
  occurred_at: '2026-09-02T17:25:47.610257Z'
  observation: ''
  reason_ids: []
---

# Weighted Word Mapping

[Open on Leetcode](https://leetcode.com/problems/weighted-word-mapping/description/)

## Recognition signals

- Each word is independent and reduces to one integer before the final mapping.
- A fixed 26-entry lookup plus modulo 26 signals direct simulation, not DP.

## Core insight

- For each word, sum weights[ord(char) - ord('a')], reduce modulo 26, then use chr(ord('z') - remainder) to reverse-map it.

## Approach

- Loop through words and reset the running weight.
- Look up each character with ord(char) - ord('a').
- Store each completed word total in word_idx.
- Reduce each total with % 26.
- Subtract the remainder from ord('z') and append the mapped character.

## Invariants

- The running total equals the weights of all characters processed in the current word.
- Every remainder is between 0 and 25.
- The output gains exactly one character per completed word.

## Edge cases

- Remainder 0 maps to z and remainder 25 maps to a.
- Repeated letters contribute their weight once per occurrence.
- Single-character words still follow the same lookup and modulo steps.

## Follow-up

- Build mapped characters in a list and join once to guarantee linear output construction.
