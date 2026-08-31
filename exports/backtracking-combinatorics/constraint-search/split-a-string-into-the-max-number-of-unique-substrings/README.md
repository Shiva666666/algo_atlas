---
export_schema_version: 1
id: 04579f35-c4a8-491b-9969-97072142564d
source: leetcode
source_key: '1593'
slug: split-a-string-into-the-max-number-of-unique-substrings
title: Split a String Into the Max Number of Unique Substrings
url: https://leetcode.com/problems/split-a-string-into-the-max-number-of-unique-substrings/
difficulty: Medium
status: Resolved
primary_subtag_id: 40bb7087-9862-5cad-8a94-b3dc441b47b5
primary_path:
- backtracking-combinatorics
- constraint-search
taxonomy_ids:
- b982f2f2-cab6-50cf-8cb7-56825e9fd2b4
time_complexity: O(n · 2ⁿ)
space_complexity: O(n)
created_at: '2026-08-31T13:54:47.642090Z'
updated_at: '2026-08-31T13:54:47.642094Z'
mistake_events:
- id: 1d57716f-c654-467b-9df0-04a7feb74138
  occurred_at: '2026-08-31T13:54:47.643772Z'
  observation: ''
  reason_ids: []
---

# Split a String Into the Max Number of Unique Substrings

[Open on Leetcode](https://leetcode.com/problems/split-a-string-into-the-max-number-of-unique-substrings/)

## Approach

- At each index, try every non-empty next substring.
- Keep chosen substrings in seen, recurse from the next index, then remove the choice while backtracking.
