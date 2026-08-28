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
