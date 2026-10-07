class Solution:
    def wiggleSort(self, nums: list[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        x = sorted(nums)

        i = (len(nums) - 1) // 2
        j = len(nums) - 1
        z = 0

        while z < len(nums):
            nums[z] = x[i]
            z += 1
            i -= 1

            if z < len(nums):
                nums[z] = x[j]
                z += 1
                j -= 1
