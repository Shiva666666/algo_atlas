from collections import deque
from typing import List


class Solution:
    def isBipartite(self, graph: List[List[int]]) -> bool:
        set1 = set()
        set2 = set()

        for start in range(len(graph)):
            if start in set1 or start in set2:
                continue

            queue = deque([start])
            set2.add(start)

            while queue:
                node = queue.popleft()
                current_set = set1 if node in set1 else set2
                opposite_set = set2 if node in set1 else set1

                for neighbor in graph[node]:
                    if neighbor in current_set:
                        return False

                    if neighbor not in opposite_set:
                        opposite_set.add(neighbor)
                        queue.append(neighbor)

        return True
