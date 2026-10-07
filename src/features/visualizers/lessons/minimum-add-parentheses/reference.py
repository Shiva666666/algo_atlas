class Solution:
    def minAddToMakeValid(self, s: str) -> int:

        stack = []
        count = 0

        for par in s:

            match par:
                case '(':
                    stack.append(par)
                case ')':
                    if stack:
                        stack.pop()
                    else:
                        count+=1

        count+=len(stack)

        return count
