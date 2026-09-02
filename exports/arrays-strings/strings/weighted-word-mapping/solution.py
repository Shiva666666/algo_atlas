class Solution:
    def mapWordWeights(self, words: List[str], weights: List[int]) -> str:

        word_idx = []

        for word in words:

            weight = 0

            for char in word:

                weight += weights[ord(char) - ord('a')]

            word_idx.append(weight)

        res = ""

        for idx in word_idx:

            x = idx % 26

            real = ord('z') - x

            #word_idx.append(chr(real))
            res += chr(real)

        #return "".join(word_idx)

        return res
