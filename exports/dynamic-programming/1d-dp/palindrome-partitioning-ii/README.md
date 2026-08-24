---
export_schema_version: 1
id: 6284537b-823e-4ed5-ad6f-a28129c54f1f
source: leetcode
source_key: palindrome-partitioning-ii
slug: palindrome-partitioning-ii
title: Palindrome Partitioning II
url: https://leetcode.com/problems/palindrome-partitioning-ii/description/
difficulty: Hard
status: Resolved
primary_subtag_id: 7b597323-a5dd-5b2e-84d7-0ae42c92c0f8
primary_path:
- dynamic-programming
- 1d-dp
taxonomy_ids:
- 344303c1-32ea-5183-81ca-ef93be3622bb
- 4d220417-3420-55dc-8eab-60e2ed1702b5
- b982f2f2-cab6-50cf-8cb7-56825e9fd2b4
time_complexity: O(n^2)
space_complexity: O(n^2)
created_at: '2026-08-24T18:12:15.562015Z'
updated_at: '2026-08-24T18:12:15.696026Z'
mistake_events:
- id: c0bb7566-a611-4a0c-ae60-dafa2065db2f
  occurred_at: '2026-08-24T18:12:15.569389Z'
  observation: 'Attempt 1: interval recursion explored every split without a viable
    state reduction and timed out.'
  reason_ids:
  - 51286a52-5e07-5d2d-9618-1fcee2925c0c
- id: 8eeda70e-4e25-4c39-98aa-e1bbb47deb5f
  occurred_at: '2026-08-24T18:12:15.618505Z'
  observation: 'Attempt 2: memoized solve(i, j) had O(n^2) states and O(n) split work
    per state, so O(n^3) still timed out for n = 2000.'
  reason_ids:
  - 51286a52-5e07-5d2d-9618-1fcee2925c0c
- id: 557b2815-c9dc-4765-b773-ac4cbb28e1db
  occurred_at: '2026-08-24T18:12:15.665900Z'
  observation: 'Attempt 3: checked palindrome[end][start] and added cuts[end - 1]
    instead of palindrome[start][end] and cuts[start - 1]; Wrong Answer on cdd.'
  reason_ids:
  - 1c010780-c1de-5c7c-837d-535455ce3f36
- id: 76dd9194-cc32-4c70-99d4-5205b02f2fd7
  occurred_at: '2026-08-24T18:12:15.695575Z'
  observation: 'Attempt 4: printed the O(n^2) palindrome table and hit Output Limit
    Exceeded even after the recurrence was corrected.'
  reason_ids:
  - 63a4f2e6-33e2-519b-9850-fae53c50574c
---

# Palindrome Partitioning II

[Open on Leetcode](https://leetcode.com/problems/palindrome-partitioning-ii/description/)

## Why I missed it

- Memoizing solve(i, j) still leaves O(n^2) interval states with O(n) split work per state: O(n^3).
- Read the palindrome table backwards as palindrome[end][start] instead of palindrome[start][end].
- Used cuts[end - 1] instead of cuts[start - 1], so the transition ignored where the final palindrome began.
- Left print(palindrome) in an O(n^2) solution and triggered Output Limit Exceeded.

## Recognition signals

- Minimum cuts over a prefix plus fast validity checks for every substring suggests precompute + prefix DP.
- When the transition asks where the final valid segment starts, prefer a 1D prefix state over solving both interval halves.

## Core insight

- Precompute palindrome[start][end], then choose the start of the final palindrome for each prefix ending at end.
- Always calculate DP cost as number of states multiplied by work per state; memoization alone does not guarantee speed.

## Approach

- Fill the palindrome table with start decreasing so palindrome[start + 1][end - 1] is already known.
- Set cuts[end] = 0 when s[0:end+1] is a palindrome.
- Otherwise try every start from 1 through end and minimize cuts[start - 1] + 1 when s[start:end+1] is a palindrome.

## Invariants

- palindrome[start][end] is meaningful only when start <= end; the useful table is on or above the diagonal.
- Before computing cuts[end], every smaller prefix cut value is already optimal.
- Each transition appends exactly one verified palindrome s[start:end+1].

## Edge cases

- A single character or an entirely palindromic string needs zero cuts.
- Adjacent equal characters are a palindrome without consulting an inner interval.
- Handle start = 0 through the whole-prefix branch so cuts[-1] is never used.

## Follow-up

- An alternative center-expansion formulation keeps O(n^2) time while reducing auxiliary space to O(n).
- Remove table-sized debug output before submitting.
