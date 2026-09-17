export const referenceCode = `from typing import List

class Solution:
    def generateParenthesis(self, n: int) -> List[str]:
        result = []
        def backtrack(current, opened, closed):
            if len(current) == 2 * n:
                result.append(current)
                return
            if opened < n:
                backtrack(current + "(", opened + 1, closed)
            if closed < opened:
                backtrack(current + ")", opened, closed + 1)
        backtrack("", 0, 0)
        return result`;
