class Solution:
    def sumCounts(self, nums: List[int]) -> int:

        n = len(nums)
        MOD = 10**9 + 7


        sum_tree = [0] * (4 * n)
        sq_tree = [0] * (4 * n)
        lazy = [0] * (4 * n)

        def apply(i, l, r, val):

            length = r - l + 1

            sq_tree[i] += (
                2 * val * sum_tree[i]
                + length * val * val
            )

            sum_tree[i] += length * val

            sq_tree[i] %= MOD
            sum_tree[i] %= MOD

            lazy[i] += val

        def push(i, l, r):

            if lazy[i] == 0 or l == r:
                return

            mid = (l + r) // 2

            apply(2 * i + 1, l, mid, lazy[i])
            apply(2 * i + 2, mid + 1, r, lazy[i])

            lazy[i] = 0

        def update(s, e, i, l, r, val):

            if r < s or l > e:
                return

            if s <= l and r <= e:
                apply(i, l, r, val)
                return

            push(i, l, r)

            mid = (l + r) // 2

            update(s, e, 2 * i + 1, l, mid, val)
            update(s, e, 2 * i + 2, mid + 1, r, val)

            sum_tree[i] = (
                sum_tree[2 * i + 1]
                + sum_tree[2 * i + 2]
            ) % MOD

            sq_tree[i] = (
                sq_tree[2 * i + 1]
                + sq_tree[2 * i + 2]
            ) % MOD

        last = {}
        res = 0

        for right in range(n):

            num = nums[right]

            prev = last.get(num, -1)

            update(prev + 1, right, 0, 0, n - 1, 1)

            last[num] = right

            res += sq_tree[0]
            res %= MOD

        return res
