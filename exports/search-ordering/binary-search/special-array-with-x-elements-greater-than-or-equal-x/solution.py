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
