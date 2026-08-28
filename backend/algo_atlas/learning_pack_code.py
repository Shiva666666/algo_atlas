from __future__ import annotations

from textwrap import dedent


def _code(value: str) -> str:
    return dedent(value).lstrip()


LEARNING_PACK_CODE: dict[str, str] = {
    "ticket-to-ride": _code(
        '''
        # Learning scaffold — the imported chat did not contain a completed solution.
        #
        # Intended direction:
        #   1. Root the given road tree.
        #   2. Let each subtree expose at most one unfinished path arm.
        #   3. Continue one child arm or join two arms through the current node.
        #   4. Never combine three arms: the chosen result must remain one simple path.
        #   5. Add the ticket-reward bookkeeping after the exact constraints are derived.
        #
        # Keep this scaffold instead of presenting an unverified full solution as yours.
        '''
    ),
    "abc395-g": _code(
        '''
        # preprocess
        n, k = map(int, input().split())

        cost = []
        for i in range(n):
            cost.append(list(map(int, input().split())))

        queries_length = int(input())
        queries = []

        for i in range(queries_length):
            queries.append(list(map(int, input().split())))

        # floyd for all source shortest path matrix, can use all source dijkstra too maybe time is same idk, GPT says dijkstras is O(N(ElogN)) for all pairs
        # makes sense so for all pairs in a dense complete graph it might be O(N**3logN) as E becomes N**2
        # floyd is a standard N**3
        # The reason we do not miss it is that Floyd's DP state is not "use exactly k." It is: shortest path from i to j using only intermediates 0...k
        for intermediate_vertex in range(n):
            for current_vertex in range(n):
                for final_vertex in range(n):
                    cost[current_vertex][final_vertex] = min(
                        cost[current_vertex][final_vertex],
                        cost[current_vertex][intermediate_vertex]
                        + cost[intermediate_vertex][final_vertex],
                    )

        # stiener dp
        INF = float("inf")
        dp = [[INF] * n for _ in range(1 << k)]
        dp[0] = [0] * n  # empty subset is 0

        for t in range(k):
            dp[1 << t][t] = 0  # when only terminal is requried (basecase) bottom of our tree cost is 0

        for mask in range(1, 1 << k):
            sub = mask
            while True:
                other = mask ^ sub
                for v in range(n):
                    dp[mask][v] = min(
                        dp[mask][v],
                        dp[sub][v] + dp[other][v],
                    )  # merging two subsets which are mutually exclusive

                # this has to be outside the for v loop
                if sub == 0:
                    break
                sub = (sub - 1) & mask

            old = dp[mask][:]
            for u in range(n):
                for v in range(n):
                    dp[mask][u] = min(dp[mask][u], old[v] + cost[v][u])

        full_mask = (1 << k) - 1
        answer = [[INF] * n for _ in range(n)]

        # s can be any non-fixed terminal
        for s in range(k, n):
            # ndp[mask][v] connects s, the fixed terminals in mask, and v
            ndp = [[INF] * n for _ in range(1 << k)]
            ndp[0][s] = 0

            for mask in range(1 << k):
                sub = mask
                while True:
                    other = mask ^ sub
                    for v in range(n):
                        ndp[mask][v] = min(
                            ndp[mask][v],
                            ndp[sub][v] + dp[other][v],
                        )

                    if sub == 0:
                        break
                    sub = (sub - 1) & mask

                old = ndp[mask][:]
                for u in range(n):
                    for v in range(n):
                        ndp[mask][u] = min(
                            ndp[mask][u],
                            old[v] + cost[v][u],
                        )

            for t in range(k, n):
                answer[s][t] = ndp[full_mask][t]

        # queries use 1-based vertex numbering
        for s, t in queries:
            print(answer[s - 1][t - 1])
        '''
    ),
    "koko-eating-bananas": _code(
        '''
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
        '''
    ),
    "special-array-with-x-elements-greater-than-or-equal-x": _code(
        '''
        from typing import List


        class Solution:
            def specialArray(self, nums: List[int]) -> int:
                n = len(nums)
                left = 0
                right = n

                while left <= right:
                    mid = (left + right) // 2

                    count = 0
                    for num in nums:
                        if num >= mid:
                            count += 1

                    if count == mid:
                        return mid
                    elif count > mid:
                        left = mid + 1
                    else:
                        right = mid - 1

                return -1
        '''
    ),
    "minimum-falling-path-sum": _code(
        '''
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
        '''
    ),
    "is-graph-bipartite": _code(
        '''
        from collections import deque
        from typing import List


        class Solution:
            def isBipartite(self, graph: List[List[int]]) -> bool:
                set1 = set()
                set2 = set()

                for start in range(len(graph)):
                    if start in set1 or start in set2:
                        continue

                    queue = deque([start])
                    set2.add(start)

                    while queue:
                        node = queue.popleft()
                        current_set = set1 if node in set1 else set2
                        opposite_set = set2 if node in set1 else set1

                        for neighbor in graph[node]:
                            if neighbor in current_set:
                                return False

                            if neighbor not in opposite_set:
                                opposite_set.add(neighbor)
                                queue.append(neighbor)

                return True
        '''
    ),
    "subsets-ii": _code(
        '''
        from typing import List


        class Solution:
            def subsetsWithDup(self, nums: List[int]) -> List[List[int]]:
                nums.sort()
                result = []
                subset = []

                def backtrack(i: int) -> None:
                    result.append(subset[:])

                    for j in range(i + 1, len(nums)):
                        # Skip equal values only when they are siblings.
                        if j > i + 1 and nums[j] == nums[j - 1]:
                            continue

                        subset.append(nums[j])
                        backtrack(j)
                        subset.pop()

                backtrack(-1)
                return result
        '''
    ),
    "generate-all-possible-parentheses": _code(
        '''
        class Solution:
            def generateParentheses(self, n: int) -> list[str]:
                res = []

                def backtrack(parentheses, opened, closed):
                    if closed > opened or len(parentheses) > n:
                        return

                    if len(parentheses) == n and opened == closed:
                        res.append(parentheses)
                        return

                    backtrack(parentheses + "(", opened + 1, closed)
                    backtrack(parentheses + ")", opened, closed + 1)

                backtrack("(", 1, 0)
                return res
        '''
    ),
    "longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit": _code(
        '''
        from collections import deque
        from typing import List


        class Solution:
            def longestSubarray(self, nums: List[int], limit: int) -> int:
                min_q = deque()
                max_q = deque()
                left = 0
                answer = 0

                for right, value in enumerate(nums):
                    while max_q and nums[max_q[-1]] < value:
                        max_q.pop()
                    max_q.append(right)

                    while min_q and nums[min_q[-1]] > value:
                        min_q.pop()
                    min_q.append(right)

                    while nums[max_q[0]] - nums[min_q[0]] > limit:
                        if max_q[0] == left:
                            max_q.popleft()
                        if min_q[0] == left:
                            min_q.popleft()
                        left += 1

                    answer = max(answer, right - left + 1)

                return answer
        '''
    ),
    "ipo": _code(
        '''
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
        '''
    ),
}
