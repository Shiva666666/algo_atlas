from typing import List


class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        left = 1
        right = max(piles)

        def koko_ate(k: int) -> bool:
            hours = 0
            for pile in piles:
                hours += (pile + k - 1) // k
            return hours <= h

        while left < right:
            mid = (left + right) // 2

            if koko_ate(mid):
                right = mid
            else:
                left = mid + 1

        return left
