class Solution:
    def countGoodStrings(self, low: int, high: int, zero: int, one: int) -> int:
        memo = {high:1}

        def topdown(length):
            if length > high:
                return 0
            if length in memo:
                return memo[length]
            val = 0 if length < low else 1
            val += (topdown(length + zero) + topdown(length + one))
            memo[length] = val % (10**9 + 7)
            return memo[length]

        return topdown(0)
