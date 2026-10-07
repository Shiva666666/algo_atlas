class Solution:
    def scoreOfParentheses(self, s: str) -> int:

        i = 0
        n = len(s)
        global_track = 0
        depth = 0

        while i < n:

            if s[i] == '(':
                depth += 1
                i += 1

            else:
                depth -= 1
                if s[i - 1] == '(':
                    global_track += 2 ** depth
                i += 1

        return global_track
