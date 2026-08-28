---
export_schema_version: 1
id: d71c6612-135e-496b-b881-8e1d12e2f7b1
source: hackerrank
source_key: ticket-to-ride
slug: ticket-to-ride
title: Ticket to Ride
url: https://www.hackerrank.com/challenges/ticket-to-ride/problem
difficulty: Hard
status: Open
primary_subtag_id: dc9d3a67-20be-566c-8481-7ba8ce169329
primary_path:
- dynamic-programming
- tree-dp
taxonomy_ids:
- 08c05564-cd65-5b72-a179-d15e2e39edbe
time_complexity: ''
space_complexity: ''
created_at: '2026-08-27T19:49:12.637741Z'
updated_at: '2026-08-28T01:03:48.463080Z'
mistake_events:
- id: 3579e6a7-5cb3-42c8-8b36-5c67aa25f6a5
  occurred_at: '2026-08-27T19:49:12.639860Z'
  observation: Initially classified the problem as Steiner Tree because tickets connect
    city pairs.
  reason_ids:
  - 19a10c0e-06af-51ae-9072-be6338e02ef1
  - 5b8bba84-1b4b-5a1c-ba66-a93cc6d71563
---

# Ticket to Ride

[Open on Hackerrank](https://www.hackerrank.com/challenges/ticket-to-ride/problem)

## Why I missed it

- The network wording looked like a general connection problem, but the given roads already form a tree.

## Recognition signals

- An existing tree plus two chosen endpoints means there is exactly one candidate path for that pair.
- A legal answer cannot branch; every selected vertex has path-degree at most two.

## Core insight

- This is tree/path optimization, not subset-of-terminals Steiner DP.

## Approach

- Define what information an unfinished path must expose to its parent.
- Combine at most two child arms through a node; a third arm would create illegal branching.
- Attach road costs and ticket rewards to the path state only after the state meaning is precise.

## Invariants

- Every partial candidate remains extendable into one simple path.

## Edge cases

- A two-city tree.
- The optimal path has one endpoint at an internal node.
- A valuable ticket whose endpoints cannot both lie on the chosen path.

## Follow-up

- Derive the exact ticket-contribution bookkeeping from the official constraints before writing a recurrence.
