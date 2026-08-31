class Solution:
    def incremovableSubarrayCount(self, nums: List[int]) -> int:
        n = len(nums)
        i = 0

        # Find the longest strictly increasing prefix.
        while i + 1 < n and nums[i] < nums[i + 1]:
            i += 1

        # Every non-empty subarray is removable.
        if i == n - 1:
            return n * (n + 1) // 2

        # Empty suffix: remove [start, n - 1] for start in [0, i + 1].
        ans = i + 2
        j = n - 1

        # Extend a strictly increasing suffix to the left.
        while j == n - 1 or nums[j] < nums[j + 1]:
            # The retained prefix must connect strictly below nums[j].
            while i >= 0 and nums[i] >= nums[j]:
                i -= 1

            # Remove [start, j - 1] for every start in [0, i + 1].
            ans += i + 2
            j -= 1

        return ans
