class Solution:
    def divide(self, dividend: int, divisor: int) -> int:

        if dividend == -2**31 and divisor == -1:
            return 2**31 - 1

        i = 31
        res = 0

        is_neg = False if (1<<31&dividend) == (1<<31&divisor) else True

        if (1<<31&dividend):
            dividend = ~dividend + 1
        if (1<<31&divisor):
            divisor= ~divisor + 1

        while i>-1:

            if (divisor<<i) > dividend:
                i-=1
            else:
                dividend -= (divisor << i)
                res += 1<<i
                i-=1



        return res if not is_neg else -res
