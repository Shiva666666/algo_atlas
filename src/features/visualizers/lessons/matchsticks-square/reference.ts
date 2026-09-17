

export const matchsticksSquareCode = `class Solution:
    def makesquare(self, matchsticks: List[int]) -> bool:

        target = sum(matchsticks) // 4

        if sum(matchsticks) % 4 != 0:
            return False

        matchsticks.sort()
        matchsticks.reverse()

        def backtrack(i, left, right, top, down):

            if i == len(matchsticks) and (left == right and right == top and top == down):
                return True
            elif i >= len(matchsticks) and (left != right or right != top or top != down):
                return False
            else:
                if left + matchsticks[i] <= target:
                    if backtrack(i+1, left + matchsticks[i], right, top, down):
                        return True
                if right + matchsticks[i] <= target:
                    if backtrack(i+1, left, right + matchsticks[i], top, down):
                        return True

                if top + matchsticks[i] <= target:
                    if backtrack(i+1, left, right, top + matchsticks[i], down):
                        return True
                if down + matchsticks[i] <= target:
                    if backtrack(i+1, left, right, top, down+matchsticks[i]):
                        return True

            return False

        return backtrack(0,0,0,0,0)`;