class Solution:
    def sum(self, num1: int, num2: int) -> int:

        res = 0
        carry = 0

        for i in range(32):
            a = (num1 >> i) & 1
            b = (num2 >> i) & 1

            sum_bit = a ^ b ^ carry
            carry = (a & b) | ((a ^ b) & carry)

            res |= (sum_bit << i)

        if res & (1 << 31):
            return ~(res ^ 0xFFFFFFFF)

        return res
