---
export_schema_version: 1
id: 940ddbe1-a81b-4bcb-8b14-754e989792cf
source: leetcode
source_key: koko-eating-bananas
slug: koko-eating-bananas
title: Koko Eating Bananas
url: https://leetcode.com/problems/koko-eating-bananas/
difficulty: Medium
status: Understood
primary_subtag_id: 539ba9fe-cbf9-5199-bc70-cbf4767d39e3
primary_path:
- search-ordering
- binary-search
taxonomy_ids:
- b0652ae3-41f7-5430-884a-13ba1fb5a6bd
time_complexity: O(n log max(piles))
space_complexity: O(1)
created_at: '2026-08-27T19:49:12.677170Z'
updated_at: '2026-08-28T01:03:48.499491Z'
mistake_events:
- id: ac38e2e3-076f-436c-96bd-eb79a5f0002f
  occurred_at: '2026-08-27T19:49:12.677581Z'
  observation: The feasibility calculation used a hard-coded divisor and shadowed
    the candidate parameter.
  reason_ids:
  - 1c010780-c1de-5c7c-837d-535455ce3f36
  - 63a4f2e6-33e2-519b-9850-fae53c50574c
---

# Koko Eating Bananas

[Open on Leetcode](https://leetcode.com/problems/koko-eating-bananas/)

## Why I missed it

- Mixed up the candidate answer with an array position and did not consistently test the current midpoint.

## Recognition signals

- The question asks for a minimum integer rate and feasibility becomes easier as the rate increases.

## Core insight

- Binary-search the first speed whose total required hours is at most h.

## Approach

- Bound the speed from 1 through the largest pile.
- Evaluate one midpoint by summing ceiling divisions.
- Keep the midpoint when feasible because it may be the first valid speed; otherwise discard it and every slower speed.

## Invariants

- The answer always remains inside the current inclusive interval.

## Edge cases

- One pile.
- h equals the number of piles.
- Very large piles where floating-point ceiling should be avoided.

## Follow-up

- Practice naming the monotonic predicate before choosing boundary updates.
