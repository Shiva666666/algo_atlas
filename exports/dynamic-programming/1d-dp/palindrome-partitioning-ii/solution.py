class Solution:
    def minCut(self, s: str) -> int:
        n = len(s)
        palindrome = [[False] * n for _ in range(n)]

        for i in range(n):
            palindrome[i][i] = True

        for start in range(n - 1, -1, -1):
            for end in range(start + 1, n):
                if s[start] == s[end] and (
                    end - start == 1 or palindrome[start + 1][end - 1]
                ):
                    palindrome[start][end] = True

        cuts = [float("inf")] * n
        for end in range(n):
            if palindrome[0][end]:
                cuts[end] = 0
            else:
                for start in range(1, end + 1):
                    if palindrome[start][end]:
                        cuts[end] = min(cuts[end], cuts[start - 1] + 1)

        return cuts[-1]
