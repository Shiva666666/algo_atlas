class Solution:
    def countMaxOrSubsets(self, nums: list[int]) -> int:

        memo = {}
        max_or = 0

        for num in nums:
            max_or |= num

        def backtrack(cur_pos, cur_or):

            if (cur_pos, cur_or) in memo:
                return memo[cur_pos, cur_or]

            if cur_pos == len(nums):
                return 1 if cur_or == max_or else 0

            take = backtrack(cur_pos + 1, cur_or | nums[cur_pos])

            skip = backtrack(cur_pos + 1, cur_or)

            memo[cur_pos, cur_or] = take + skip
            return take + skip

        return backtrack(0, 0)
