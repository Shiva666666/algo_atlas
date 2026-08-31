from typing import List


class Solution:
    def solve_n_queens(self, n: int) -> List[List[str]]:
        res = []
        sol = []
        col, diag1, diag2 = set(), set(), set()

        def backtrack(i):
            if i == n:
                res.append(sol[:])
                return

            for k in range(n):
                d1 = i - k
                d2 = i + k

                if k in col or d1 in diag1 or d2 in diag2:
                    continue

                row_str = "." * k + "Q" + "." * (n - k - 1)
                sol.append(row_str)
                col.add(k)
                diag1.add(d1)
                diag2.add(d2)

                backtrack(i + 1)

                col.remove(k)
                diag1.remove(d1)
                diag2.remove(d2)
                sol.pop()

        backtrack(0)
        return res
