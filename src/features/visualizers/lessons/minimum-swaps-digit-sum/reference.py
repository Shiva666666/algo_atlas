class Solution:
    def minSwaps(self, nums: List[int]) -> int:

        def add_digits(i):
            total = 0

            while i:
                total += i % 10
                i //= 10

            return total

        sorted_nums = sorted(nums, key=lambda x: (add_digits(x), x))

        pos = {}

        for i in range(len(nums)):
            pos[nums[i]] = i

        count = 0

        for i in range(len(nums)):

            if nums[i] != sorted_nums[i]:

                j = pos[sorted_nums[i]]

                pos[nums[i]] = j
                pos[sorted_nums[i]] = i

                nums[i], nums[j] = nums[j], nums[i]

                count += 1

        return count
