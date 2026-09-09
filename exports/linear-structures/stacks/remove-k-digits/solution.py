class Solution:
    def removeKdigits(self, num: str, k: int) -> str:

        if len(num) == k:
            return "0"

        stack = []

        for i in range(len(num)):

            cur = int(num[i])

            while stack and int(num[stack[-1]]) > cur and k:
                stack.pop()
                k-=1

            stack.append(i)

        res = ""

        while k and stack:
            stack.pop()
            k-=1

        for digit in stack:

            res += num[digit]

        i = 0

        if len(res) > 1:

            while i<len(res) and res[i] == "0":
                i+=1


        return "0" if i == len(res) else res[i:]
