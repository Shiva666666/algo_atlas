class Solution:
    def generateParentheses(self, n: int) -> list[str]:
        res = []

        def backtrack(parentheses, opened, closed):
            if closed > opened or len(parentheses) > n:
                return

            if len(parentheses) == n and opened == closed:
                res.append(parentheses)
                return

            backtrack(parentheses + "(", opened + 1, closed)
            backtrack(parentheses + ")", opened, closed + 1)

        backtrack("(", 1, 0)
        return res
