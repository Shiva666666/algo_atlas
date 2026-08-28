import heapq
from typing import List


class Solution:
    def findMaximizedCapital(
        self,
        k: int,
        w: int,
        profits: List[int],
        capital: List[int],
    ) -> int:
        available = [(cap, profit) for profit, cap in zip(profits, capital)]
        heapq.heapify(available)
        profit_heap = []

        while k:
            while available and available[0][0] <= w:
                cap, profit = heapq.heappop(available)
                heapq.heappush(profit_heap, -profit)

            if not profit_heap:
                break

            w += -heapq.heappop(profit_heap)
            k -= 1

        return w
