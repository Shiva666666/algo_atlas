class Solution:
    def incremovableSubarrayCount(self, nums: List[int]) -> int:
        res = 0

        def check(arr):
            for x, y in zip(arr, arr[1:]):
                if x >= y:
                    return False
            return True

        for i in range(len(nums)):
            for j in range(i, len(nums)):
                arr = []

                for k in range(len(nums)):
                    if not i <= k <= j:
                        arr.append(nums[k])

                if check(arr):
                    res += 1

        return res
