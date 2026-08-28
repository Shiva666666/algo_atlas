from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from .db import engine, init_db, slugify, sync_problem_search
from .learning_pack_code import LEARNING_PACK_CODE
from .models import MistakeEvent, MistakeEventReason, NoteBullet, Problem, ProblemTaxonomy, TaxonomyNode


LEARNING_PACK: list[dict[str, Any]] = [
    {
        "source": "hackerrank",
        "source_key": "ticket-to-ride",
        "title": "Ticket to Ride",
        "url": "https://www.hackerrank.com/challenges/ticket-to-ride/problem",
        "difficulty": "Hard",
        "status": "Open",
        "primary_subtag": "tree-dp",
        "taxonomy": ["graph-traversal"],
        "failure_reasons": ["failure-pattern-not-recognized", "failure-misread-requirement"],
        "time_complexity": "",
        "space_complexity": "",
        "observation": "Initially classified the problem as Steiner Tree because tickets connect city pairs.",
        "notes": {
            "why_missed": ["The network wording looked like a general connection problem, but the given roads already form a tree."],
            "recognition_signals": ["An existing tree plus two chosen endpoints means there is exactly one candidate path for that pair.", "A legal answer cannot branch; every selected vertex has path-degree at most two."],
            "core_insight": ["This is tree/path optimization, not subset-of-terminals Steiner DP."],
            "approach": ["Define what information an unfinished path must expose to its parent.", "Combine at most two child arms through a node; a third arm would create illegal branching.", "Attach road costs and ticket rewards to the path state only after the state meaning is precise."],
            "invariants": ["Every partial candidate remains extendable into one simple path."],
            "edge_cases": ["A two-city tree.", "The optimal path has one endpoint at an internal node.", "A valuable ticket whose endpoints cannot both lie on the chosen path."],
            "follow_up": ["Derive the exact ticket-contribution bookkeeping from the official constraints before writing a recurrence."],
        },
    },
    {
        "source": "atcoder",
        "source_key": "abc395-g",
        "title": "Minimum Steiner Tree 2",
        "url": "https://atcoder.jp/contests/abc395/tasks/abc395_g",
        "difficulty": "Hard",
        "status": "Open",
        "primary_subtag": "bitmask-dp",
        "taxonomy": ["shortest-paths", "spanning-trees", "tabulation"],
        "failure_reasons": ["failure-unknown-technique", "failure-incorrect-state-transition"],
        "time_complexity": "O(3^K N^2 + 2^K N^3)",
        "space_complexity": "O(2^K N + N^2)",
        "observation": "Needed intuition for the subset merge, root movement, and why query vertex t is a column rather than a mask bit.",
        "notes": {
            "why_missed": ["Tried to think about subsets of optional Steiner vertices instead of subsets of the at-most-eight fixed terminals."],
            "recognition_signals": ["A very small terminal count K alongside a much larger graph suggests a terminal-mask state.", "The state must be connected and also expose an attachment vertex v.", "Many queries differ only by s and t, so fixed-terminal work should be reusable."],
            "core_insight": ["DP[mask][v] is the cheapest connected graph containing every terminal in mask and the attachment vertex v.", "Two trees can merge only when they share the same v; shortest-path relaxation then moves v through arbitrary connector vertices."],
            "approach": ["Seed empty and singleton fixed-terminal states.", "For each mask, try proper submask splits that meet at the same root.", "Close the completed row with dense Dijkstra so optional connector vertices emerge without mask bits.", "For each possible s, build a second layer that carries s on exactly one side of every merge.", "Answer a query by reading the full fixed-terminal mask at column t."],
            "invariants": ["Every finite state is connected and contains exactly the required terminal set, plus its root.", "The query-specific side carries s exactly once."],
            "edge_cases": ["Zero-weight edges and tied optimal trees.", "A nonterminal hub that is absent from the query but essential to the optimum.", "Costs require 64-bit totals.", "K=1 leaves no nontrivial fixed-terminal split."],
            "follow_up": ["Reconstruct predecessor edges for one query after the state transitions feel natural."],
        },
    },
    {
        "source": "leetcode",
        "source_key": "koko-eating-bananas",
        "title": "Koko Eating Bananas",
        "url": "https://leetcode.com/problems/koko-eating-bananas/",
        "difficulty": "Medium",
        "status": "Understood",
        "primary_subtag": "binary-search",
        "taxonomy": ["arrays"],
        "failure_reasons": ["failure-implementation-bug", "failure-incorrect-state-transition"],
        "time_complexity": "O(n log max(piles))",
        "space_complexity": "O(1)",
        "observation": "The feasibility calculation used a hard-coded divisor and shadowed the candidate parameter.",
        "notes": {
            "why_missed": ["Mixed up the candidate answer with an array position and did not consistently test the current midpoint."],
            "recognition_signals": ["The question asks for a minimum integer rate and feasibility becomes easier as the rate increases."],
            "core_insight": ["Binary-search the first speed whose total required hours is at most h."],
            "approach": ["Bound the speed from 1 through the largest pile.", "Evaluate one midpoint by summing ceiling divisions.", "Keep the midpoint when feasible because it may be the first valid speed; otherwise discard it and every slower speed."],
            "invariants": ["The answer always remains inside the current inclusive interval."],
            "edge_cases": ["One pile.", "h equals the number of piles.", "Very large piles where floating-point ceiling should be avoided."],
            "follow_up": ["Practice naming the monotonic predicate before choosing boundary updates."],
        },
    },
    {
        "source": "leetcode",
        "source_key": "special-array-with-x-elements-greater-than-or-equal-x",
        "title": "Special Array With X Elements Greater Than or Equal X",
        "url": "https://leetcode.com/problems/special-array-with-x-elements-greater-than-or-equal-x/",
        "difficulty": "Easy",
        "status": "Understood",
        "primary_subtag": "binary-search",
        "taxonomy": ["arrays", "sorting"],
        "failure_reasons": ["failure-incorrect-state-transition", "failure-complexity-tle"],
        "time_complexity": "O(n log n)",
        "space_complexity": "O(1)",
        "observation": "The search could repeat the same midpoint and assumed x had to be present in the array.",
        "notes": {
            "why_missed": ["Searched array values instead of the answer range 0 through n and used a bound update that did not guarantee progress."],
            "recognition_signals": ["x is defined by a count, so it may not appear in nums.", "count(nums >= x) is monotonic as x grows."],
            "core_insight": ["Find the largest x with count(nums >= x) >= x, then verify equality."],
            "approach": ["Search candidate answers from 0 to n.", "Count qualifying values at the midpoint.", "Use boundary updates that strictly shrink the interval.", "Verify exact equality at the final boundary."],
            "invariants": ["Candidates larger than the right bound cannot satisfy the count condition."],
            "edge_cases": ["All zeros.", "The valid x is absent from nums.", "The monotonic boundary exists but the final count is not equal to x."],
            "follow_up": ["Compare with sorting plus a linear scan."],
        },
    },
    {
        "source": "leetcode",
        "source_key": "minimum-falling-path-sum",
        "title": "Minimum Falling Path Sum",
        "url": "https://leetcode.com/problems/minimum-falling-path-sum/",
        "difficulty": "Medium",
        "status": "Understood",
        "primary_subtag": "2d-and-grid-dp",
        "taxonomy": ["matrices-and-grids", "memoization", "tabulation"],
        "failure_reasons": ["failure-boundary-or-indexing-error", "failure-incorrect-state-transition"],
        "time_complexity": "O(rows × columns)",
        "space_complexity": "O(rows × columns)",
        "observation": "Needed a clear top-down state, base row, and the three legal next pointers.",
        "notes": {
            "why_missed": ["The recurrence was easier to state than the pointer bounds and row/column order."],
            "recognition_signals": ["Movement is acyclic from one row to the next and each cell has only three possible continuations."],
            "core_insight": ["State means the minimum sum starting at one cell; the last row is the base case."],
            "approach": ["Seed the last row with its own values.", "Move upward and read only down-left, down, and down-right cells that exist.", "Add the current cell to the cheapest child.", "Take the minimum value in the top row."],
            "invariants": ["The entire child row is resolved before a parent row uses it."],
            "edge_cases": ["Single cell.", "Negative values.", "Left and right columns have only two legal children."],
            "follow_up": ["Compress space to one row after the 2D state is intuitive."],
        },
    },
    {
        "source": "leetcode",
        "source_key": "is-graph-bipartite",
        "title": "Is Graph Bipartite?",
        "url": "https://leetcode.com/problems/is-graph-bipartite/",
        "difficulty": "Medium",
        "status": "Understood",
        "primary_subtag": "graph-traversal",
        "taxonomy": ["bfs", "dfs"],
        "failure_reasons": ["failure-missed-edge-case", "failure-incorrect-state-transition"],
        "time_complexity": "O(V + E)",
        "space_complexity": "O(V)",
        "observation": "The first attempt tied colors to BFS levels and did not safely handle disconnected components.",
        "notes": {
            "why_missed": ["Tracked traversal level instead of preserving one color per vertex across the whole component."],
            "recognition_signals": ["Every edge requires its endpoints to belong to opposite groups."],
            "core_insight": ["Color an unvisited neighbor opposite the current node; reject an edge whose endpoints already share a color."],
            "approach": ["Start a traversal from every still-uncolored vertex.", "Seed either color.", "Color new neighbors with the opposite value.", "Stop on a same-color edge."],
            "invariants": ["Every processed edge joins opposite colors."],
            "edge_cases": ["Disconnected graph.", "Isolated vertex.", "Odd cycle.", "Even cycle."],
            "follow_up": ["Recognize odd-cycle detection as the same invariant."],
        },
    },
    {
        "source": "leetcode",
        "source_key": "subsets-ii",
        "title": "Subsets II",
        "url": "https://leetcode.com/problems/subsets-ii/",
        "difficulty": "Medium",
        "status": "Understood",
        "primary_subtag": "subsets",
        "taxonomy": ["sorting", "constraint-search"],
        "failure_reasons": ["failure-wrong-data-structure", "failure-complexity-tle"],
        "time_complexity": "O(n log n + n × unique subsets)",
        "space_complexity": "O(n) auxiliary + output",
        "observation": "A global seen set removed duplicates only after generating them.",
        "notes": {
            "why_missed": ["The duplicate condition was treated globally instead of relative to one recursion level."],
            "recognition_signals": ["Equal sorted values create identical sibling branches, but equal values at deeper levels represent additional copies."],
            "core_insight": ["Same value plus same recursion level means skip; same value at a deeper level is allowed."],
            "approach": ["Sort so duplicate candidates are adjacent.", "Record the current path immediately.", "At each level, skip an equal value unless it is the first candidate for that level.", "Choose, recurse with the next index, and remove."],
            "invariants": ["Chosen indices strictly increase and no recursion level starts two branches with the same value."],
            "edge_cases": ["All values equal.", "No duplicates.", "Empty input.", "Several duplicate groups."],
            "follow_up": ["Relate the number of visited states to the number of unique subsets rather than only 2^n."],
        },
    },
    {
        "source": "leetcode",
        "source_key": "longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit",
        "title": "Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit",
        "url": "https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/",
        "difficulty": "Medium",
        "status": "Understood",
        "primary_subtag": "queues-and-deques",
        "taxonomy": ["sliding-window", "monotonic-queue", "arrays"],
        "failure_reasons": ["failure-wrong-data-structure", "failure-pattern-not-recognized"],
        "time_complexity": "O(n)",
        "space_complexity": "O(n)",
        "observation": "Needed to see why both a minimum deque and maximum deque are required while both window ends move.",
        "notes": {
            "why_missed": ["A running maximum or minimum cannot be repaired in O(1) when the value leaving from the left was the extreme."],
            "recognition_signals": ["A sliding window repeatedly needs its current minimum and maximum while elements expire from the left."],
            "core_insight": ["Keep only values that still have a chance to become an extreme: decreasing indices for max, increasing indices for min."],
            "approach": ["Expand the right edge.", "Remove smaller, older candidates from the max-deque back and larger, older candidates from the min-deque back.", "While the two fronts differ by more than limit, move left and expire matching fronts.", "Record the valid window length."],
            "invariants": ["Deque indices remain inside the window and ordered by arrival; deque values remain monotonic."],
            "edge_cases": ["limit is zero.", "All values equal.", "A singleton.", "A large spike splits duplicate blocks."],
            "follow_up": ["Reuse the two-deque component for any window constrained by a range."],
        },
    },
    {
        "source": "leetcode",
        "source_key": "ipo",
        "title": "IPO",
        "url": "https://leetcode.com/problems/ipo/",
        "difficulty": "Hard",
        "status": "Understood",
        "primary_subtag": "heaps",
        "taxonomy": ["greedy-construction-greedy-construction", "sorting"],
        "failure_reasons": ["failure-wrong-data-structure", "failure-complexity-tle"],
        "time_complexity": "O(n log n + k log n)",
        "space_complexity": "O(n)",
        "observation": "A single profit heap repeatedly popped and reinserted the same unaffordable project.",
        "notes": {
            "why_missed": ["One heap was asked to answer two incompatible orderings: affordability by capital and desirability by profit."],
            "recognition_signals": ["Choices unlock over time according to one key, but the greedy choice uses another key."],
            "core_insight": ["Move every newly affordable project from a capital ordering into a maximum-profit ordering, then take the best available profit."],
            "approach": ["Order locked projects by required capital.", "For each round, unlock every project affordable with current w.", "Stop if the profit structure is empty.", "Choose its maximum and add that profit to w."],
            "invariants": ["The profit structure contains all and only affordable unchosen projects."],
            "edge_cases": ["Nothing is initially affordable.", "All projects are initially affordable.", "k exceeds the number of useful projects.", "Several projects share a capital requirement."],
            "follow_up": ["State the exchange argument: a larger available profit cannot reduce future options."],
        },
    },
]


def install_learning_pack(target_engine: Engine = engine) -> dict[str, int]:
    """Install missing records and backfill only blank learning-pack code."""
    init_db(target_engine)
    created = 0
    skipped = 0
    code_restored = 0
    with Session(target_engine) as session:
        taxonomy = {node.slug: node for node in session.scalars(select(TaxonomyNode)).all()}
        for item in LEARNING_PACK:
            existing = session.scalar(
                select(Problem).where(
                    Problem.source == item["source"],
                    Problem.source_key == item["source_key"],
                )
            )
            if existing:
                recovered_code = LEARNING_PACK_CODE.get(item["source_key"], "")
                if not existing.python_code.strip() and recovered_code:
                    existing.python_code = recovered_code
                    sync_problem_search(session, existing)
                    code_restored += 1
                skipped += 1
                continue

            primary = taxonomy[item["primary_subtag"]]
            problem = Problem(
                source=item["source"],
                source_key=item["source_key"],
                slug=slugify(item["source_key"]),
                title=item["title"],
                url=item["url"],
                difficulty=item["difficulty"],
                status=item["status"],
                primary_subtag_id=primary.id,
                python_code=LEARNING_PACK_CODE.get(item["source_key"], ""),
                time_complexity=item["time_complexity"],
                space_complexity=item["space_complexity"],
            )
            session.add(problem)
            for taxonomy_slug in item["taxonomy"]:
                node = taxonomy[taxonomy_slug]
                if node.id != primary.id:
                    problem.taxonomy_links.append(ProblemTaxonomy(taxonomy_id=node.id, role=node.kind))
            for section, bullets in item["notes"].items():
                for position, bullet in enumerate(bullets):
                    problem.note_bullets.append(NoteBullet(section=section, position=position, text=bullet))
            mistake = MistakeEvent(observation=item["observation"])
            for reason_slug in item["failure_reasons"]:
                mistake.reason_links.append(MistakeEventReason(taxonomy_id=taxonomy[reason_slug].id))
            problem.mistake_events.append(mistake)
            session.flush()
            sync_problem_search(session, problem)
            created += 1
        session.commit()
    return {"created": created, "skipped": skipped, "code_restored": code_restored}


if __name__ == "__main__":
    result = install_learning_pack()
    print(
        "Learning pack ready: "
        f"{result['created']} created, "
        f"{result['skipped']} already present, "
        f"{result['code_restored']} code fields restored."
    )
