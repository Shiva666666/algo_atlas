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
