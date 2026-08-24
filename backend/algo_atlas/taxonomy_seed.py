from __future__ import annotations

MAIN_FAMILIES = [
    ("arrays-strings", "Arrays & Strings", "#2de2e6", ["Arrays", "Strings", "Matrices & Grids", "Intervals"]),
    ("linear-structures", "Linear Structures", "#55d6be", ["Linked Lists", "Stacks", "Queues & Deques"]),
    ("trees-ordered", "Trees & Ordered Structures", "#74f2a7", ["Binary Trees", "Binary Search Trees", "Tries", "Heaps", "Segment & Fenwick Trees"]),
    ("graphs-networks", "Graphs & Networks", "#7c5cff", ["Graph Traversal", "DAGs", "Union-Find", "Shortest Paths", "Spanning Trees"]),
    ("search-ordering", "Search & Ordering", "#ffb547", ["Binary Search", "Sorting", "Selection", "Divide & Conquer"]),
    ("dynamic-programming", "Dynamic Programming", "#ff3cac", ["1D DP", "2D & Grid DP", "Knapsack", "Subsequence DP", "Interval DP", "Tree DP", "Bitmask DP", "Digit DP"]),
    ("greedy-construction", "Greedy & Construction", "#ff7a59", ["Scheduling", "Sweep Line", "Greedy Construction"]),
    ("backtracking-combinatorics", "Backtracking & Combinatorics", "#a98bff", ["Subsets", "Permutations", "Constraint Search"]),
    ("math-bitwise", "Math & Bitwise", "#48a9ff", ["Number Theory", "Combinatorics", "Probability", "Geometry", "Bit Manipulation"]),
]

PATTERNS = [
    "Two Pointers", "Sliding Window", "Prefix Sums", "Monotonic Stack", "Monotonic Queue",
    "BFS", "DFS", "Topological Sort", "Memoization", "Tabulation", "State Machine",
    "Coordinate Compression", "Fast & Slow Pointers", "Meet in the Middle", "Trie Search",
]

FAILURE_REASONS = [
    "Pattern Not Recognized", "Wrong Data Structure", "Incorrect State / Transition",
    "Boundary or Indexing Error", "Missed Edge Case", "Complexity / TLE",
    "Implementation Bug", "Misread Requirement", "Python-specific Issue", "Unknown Technique",
]

LEETCODE_ALIASES = {
    "array": "arrays", "string": "strings", "matrix": "matrices-and-grids", "linked-list": "linked-lists",
    "stack": "stacks", "queue": "queues-and-deques", "tree": "binary-trees", "binary-tree": "binary-trees",
    "binary-search-tree": "binary-search-trees", "trie": "tries", "heap-priority-queue": "heaps",
    "graph": "graph-traversal", "union-find": "union-find", "shortest-path": "shortest-paths",
    "binary-search": "binary-search", "sorting": "sorting", "divide-and-conquer": "divide-and-conquer",
    "dynamic-programming": "1d-dp", "greedy": "greedy-construction", "backtracking": "constraint-search",
    "math": "number-theory", "geometry": "geometry", "bit-manipulation": "bit-manipulation",
    "two-pointers": "two-pointers", "sliding-window": "sliding-window", "prefix-sum": "prefix-sums",
    "breadth-first-search": "bfs", "depth-first-search": "dfs", "topological-sort": "topological-sort",
}
