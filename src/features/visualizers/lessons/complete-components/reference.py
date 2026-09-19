from collections import defaultdict
from typing import List


class Solution:
    def countCompleteComponents(self, n: int, edges: List[List[int]]) -> int:
        graph = defaultdict(list)
        for left, right in edges:
            graph[left].append(right)
            graph[right].append(left)

        seen = set()

        def dfs(node, component):
            seen.add(node)
            component.append(node)
            for neighbor in graph[node]:
                if neighbor not in seen:
                    dfs(neighbor, component)

        complete_count = 0
        for node in range(n):
            if node not in seen:
                component = []
                dfs(node, component)
                size = len(component)
                if all(len(graph[vertex]) == size - 1 for vertex in component):
                    complete_count += 1

        return complete_count
