class Solution:
    def maxUniqueSplit(self, s: str) -> int:
        seen = set()
        def backtrack(i):
            if i == len(s): # base leaves
                return 0
            ans = 0
            for j in range(i + 1, len(s) + 1):
                part = s[i:j] # need to slice cuz they asked substring
                if part not in seen:
                    seen.add(part) # not call existing thing again
                    ans = max(ans, 1 + backtrack(j)) # needed help couldnt figure this out
                    seen.remove(part) # standard backtrack
            return ans
        return backtrack(0)
