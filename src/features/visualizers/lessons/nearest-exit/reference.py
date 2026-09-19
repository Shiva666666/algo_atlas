from collections import deque
from typing import List


class Solution:
    def nearestExit(self, maze: List[List[str]], entrance: List[int]) -> int:
        directions = [(1, 0), (0, 1), (-1, 0), (0, -1)]
        queue = deque([(entrance[0], entrance[1], 0)])
        seen = {tuple(entrance)}

        while queue:
            row, col, distance = queue.popleft()
            on_border = row in (0, len(maze) - 1) or col in (0, len(maze[0]) - 1)
            if on_border and [row, col] != entrance:
                return distance

            for dr, dc in directions:
                nr, nc = row + dr, col + dc
                if 0 <= nr < len(maze) and 0 <= nc < len(maze[0]) and maze[nr][nc] == "." and (nr, nc) not in seen:
                    seen.add((nr, nc))
                    queue.append((nr, nc, distance + 1))

        return -1
