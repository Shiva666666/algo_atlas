import heapq
from typing import List


class Solution:
    def minTimeToReach(self, moveTime: List[List[int]]) -> int:
        rows, columns = len(moveTime), len(moveTime[0])
        best = [[float("inf")] * columns for _ in range(rows)]
        best[0][0] = 0
        heap = [(0, 0, 0)]

        while heap:
            current_time, row, column = heapq.heappop(heap)
            if current_time != best[row][column]:
                continue
            if row == rows - 1 and column == columns - 1:
                return current_time

            duration = 1 if (row + column) % 2 == 0 else 2
            for dr, dc in ((0, 1), (1, 0), (0, -1), (-1, 0)):
                nr, nc = row + dr, column + dc
                if 0 <= nr < rows and 0 <= nc < columns:
                    arrival = max(current_time, moveTime[nr][nc]) + duration
                    if arrival < best[nr][nc]:
                        best[nr][nc] = arrival
                        heapq.heappush(heap, (arrival, nr, nc))

        return -1
