class Solution:
    def minimumTotal(self, triangle: list[list[int]]) -> int:
        dp = [[float("inf")]*len(triangle[i]) for i in range(len(triangle))]
        dp[0][0] = triangle[0][0]

        for i in range(1, len(triangle)):
            dp[i][0] = dp[i-1][0] + triangle[i][0]
            for j in range(1, len(triangle[i])):
                for x in range(2):
                    if j-x < len(dp[i-1]):
                        dp[i][j] = min(dp[i][j], dp[i-1][j-x] + triangle[i][j])

        return min(dp[-1])
