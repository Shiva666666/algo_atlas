class Solution:
    def maxDepth(self, s: str) -> int:
        depth = 0
        loc_depth = 0
        i = 0

        while i < len(s):
            if s[i] == "(":
                loc_depth += 1
            elif s[i] == ")":
                depth = max(loc_depth, depth)
                loc_depth -= 1
            i += 1

        return depth
