from collections import deque
from typing import List


class Solution:
    def findFarmland(self, land: List[List[int]]) -> List[List[int]]:
        directions = [(-1, 0), (0, -1), (1, 0), (0, 1)]
        seen = set()
        result = []

        def bfs(start):
            queue = deque([start])
            max_row, max_col = start

            while queue:
                row, col = queue.popleft()
                if (row, col) in seen:
                    continue
                seen.add((row, col))
                max_row = max(max_row, row)
                max_col = max(max_col, col)

                for dr, dc in directions:
                    nr, nc = row + dr, col + dc
                    if 0 <= nr < len(land) and 0 <= nc < len(land[0]) and (nr, nc) not in seen and land[nr][nc] == 1:
                        queue.append((nr, nc))

            return max_row, max_col

        for row in range(len(land)):
            for col in range(len(land[0])):
                if land[row][col] == 1 and (row, col) not in seen:
                    end_row, end_col = bfs((row, col))
                    result.append([row, col, end_row, end_col])

        return result
