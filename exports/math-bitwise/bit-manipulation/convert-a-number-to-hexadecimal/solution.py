from collections import defaultdict


class Solution:
    def toHex(self, num: int) -> str:
        if num == 0:
            return "0"

        res = ""
        hashmap = defaultdict(str)
        num &= 0xFFFFFFFF

        for i in range(10):
            hashmap[i] = str(i)

        hashmap[10] = "a"
        hashmap[11] = "b"
        hashmap[12] = "c"
        hashmap[13] = "d"
        hashmap[14] = "e"
        hashmap[15] = "f"

        while num > 0:
            res = hashmap[num & 15] + res
            num >>= 4

        return res
