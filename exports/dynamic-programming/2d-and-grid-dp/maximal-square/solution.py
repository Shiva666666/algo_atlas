from typing import List


class Solution:
    def maximalSquare(self, matrix: List[List[str]]) -> int:
        m, n = len(matrix), len(matrix[0])

        dp = [list(map(int, row)) for row in matrix]

        res = max(
            max(dp[0]),
            max(dp[i][0] for i in range(m)),
        )

        for i in range(1, m):
            for j in range(1, n):
                if dp[i][j]:
                    dp[i][j] = 1 + min(
                        dp[i - 1][j - 1],
                        dp[i - 1][j],
                        dp[i][j - 1],
                    )

                    res = max(res, dp[i][j])

        return res ** 2
