from typing import List


class Solution:
    def minFallingPathSum(self, matrix: List[List[int]]) -> int:
        rows = len(matrix)
        columns = len(matrix[0])
        dp = matrix[-1][:]

        for i in range(rows - 2, -1, -1):
            next_row = [0] * columns

            for j in range(columns):
                best_child = dp[j]

                if j > 0:
                    best_child = min(best_child, dp[j - 1])
                if j + 1 < columns:
                    best_child = min(best_child, dp[j + 1])

                next_row[j] = matrix[i][j] + best_child

            dp = next_row

        return min(dp)
