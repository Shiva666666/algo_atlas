from typing import List


class Solution:
    def findMaxFish(self, grid: List[List[int]]) -> int:
        rows, columns = len(grid), len(grid[0])
        seen = set()

        def dfs(row: int, column: int) -> int:
            seen.add((row, column))
            subtotal = grid[row][column]
            for dr, dc in ((0, 1), (1, 0), (0, -1), (-1, 0)):
                nr, nc = row + dr, column + dc
                if 0 <= nr < rows and 0 <= nc < columns and grid[nr][nc] > 0 and (nr, nc) not in seen:
                    subtotal += dfs(nr, nc)
            return subtotal

        answer = 0
        for row in range(rows):
            for column in range(columns):
                if grid[row][column] > 0 and (row, column) not in seen:
                    answer = max(answer, dfs(row, column))
        return answer
