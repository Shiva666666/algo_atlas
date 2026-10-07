from collections import deque

class Solution:
    def checkValidString(self, s: str) -> bool:

        queue = deque()
        stars = deque()

        for i, par in enumerate(s):

            if par == '(':
                queue.append(i)

            elif par == ')':
                if queue:
                    queue.pop()
                elif stars:
                    stars.pop()
                else:
                    return False

            else:
                stars.append(i)

        while queue and stars:
            if queue[-1] > stars[-1]:
                return False

            queue.pop()
            stars.pop()

        return not queue
