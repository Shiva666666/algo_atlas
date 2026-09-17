

export const uniqueSplitCode = `class Solution:
    def maxUniqueSplit(self, s: str) -> int:
        seen = set()

        def backtrack(i):
            if i == len(s):
                return 0

            ans = 0
            for j in range(i + 1, len(s) + 1):
                part = s[i:j]
                if part not in seen:
                    seen.add(part)
                    ans = max(ans, 1 + backtrack(j))
                    seen.remove(part)
            return ans

        return backtrack(0)`;