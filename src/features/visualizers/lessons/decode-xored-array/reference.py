class Solution:
    def decode(self, encoded: list[int], first: int) -> list[int]:

        res = [first]

        for num in encoded:
            real = num^res[-1]
            res.append(real)

        return res
