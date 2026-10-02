from math import sqrt
from collections import defaultdict

class Solution:
    def numSquares(self, n: int) -> int:
        no_of_squares = int(sqrt(n))
        squares = [i**2 for i in range(1, no_of_squares + 1)]
        memo = defaultdict(int)
        for num in squares:
            memo[num] = 1

        def topdown(x):
            if x in memo:
                return memo[x]
            if x == 0:
                return 0
            val = float("inf")
            for i in range(len(squares)):
                if squares[i] > x:
                    break
                val = min(val, topdown(x - squares[i]) + 1)
            memo[x] = val
            return memo[x]

        return topdown(n)
