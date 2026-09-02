export const nQueensCode = `from typing import List

class Solution:
    def solve_n_queens(self, n: int) -> List[List[str]]:
        res = []
        sol = []
        col, diag1, diag2 = set(), set(), set()

        def backtrack(i):
            if i == n:
                res.append(sol[:])
                return

            for k in range(n):
                d1 = i - k
                d2 = i + k
                if k in col or d1 in diag1 or d2 in diag2:
                    continue

                row_str = "." * k + "Q" + "." * (n - k - 1)
                sol.append(row_str)
                col.add(k)
                diag1.add(d1)
                diag2.add(d2)

                backtrack(i + 1)

                col.remove(k)
                diag1.remove(d1)
                diag2.remove(d2)
                sol.pop()

        backtrack(0)
        return res`;

export const coinChangeCode = `from typing import List

class Solution:
    def change(self, amount: int, coins: List[int]) -> int:
        cache = {}

        def dfs(i, a):
            if a == amount:
                return 1
            if a > amount:
                return 0
            if i == len(coins):
                return 0
            if (i, a) in cache:
                return cache[(i, a)]

            cache[(i, a)] = dfs(i, a + coins[i]) + dfs(i + 1, a)
            return cache[(i, a)]

        return dfs(0, 0)`;

export const hexadecimalCode = `from collections import defaultdict

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

        return res`;

export const searchSuggestionsCode = `from typing import List

class Solution:
    def suggestedProducts(self, products: List[str], searchWord: str) -> List[List[str]]:
        trie = {}
        res = []

        # Build one path for every product.
        for product in products:
            node = trie
            for char in product:
                if char not in node:
                    node[char] = {}
                node = node[char]
            node["$"] = product

        def collect(node, temp):
            if len(temp) == 3:
                return
            if "$" in node:
                temp.append(node["$"])
            for char in sorted(node):
                if char != "$":
                    collect(node[char], temp)

        def dfs(prefix):
            node = trie
            for char in prefix:
                if char not in node:
                    return []
                node = node[char]
            temp = []
            collect(node, temp)
            return temp

        for end in range(1, len(searchWord) + 1):
            res.append(dfs(searchWord[:end]))
        return res`;

export const uniqueSplitCode = `class Solution:
    def maxUniqueSplit(self, s: str) -> int:
        seen = set()

        def backtrack(i):
            if i == len(s):
                return 0

            ans = 0
            for j in range(i + 1, len(s) + 1):
                part = s[i:j]
                if part not in seen:
                    seen.add(part)
                    ans = max(ans, 1 + backtrack(j))
                    seen.remove(part)
            return ans

        return backtrack(0)`;

export const incremovableCode = `class Solution:
    def incremovableSubarrayCount(self, nums: List[int]) -> int:
        n = len(nums)
        i = 0

        # Find the longest strictly increasing prefix.
        while i + 1 < n and nums[i] < nums[i + 1]:
            i += 1

        # Every non-empty subarray is removable.
        if i == n - 1:
            return n * (n + 1) // 2

        # Empty suffix: remove [start, n - 1] for start in [0, i + 1].
        ans = i + 2
        j = n - 1

        # Extend a strictly increasing suffix to the left.
        while j == n - 1 or nums[j] < nums[j + 1]:
            # The retained prefix must connect strictly below nums[j].
            while i >= 0 and nums[i] >= nums[j]:
                i -= 1

            # Remove [start, j - 1] for every start in [0, i + 1].
            ans += i + 2
            j -= 1

        return ans`;

export const weightedWordMappingCode = `class Solution:
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

        return res`;

// Conservative textual comparison: preserve indentation and string contents.
// This is not an arbitrary-Python verifier.
export function normalizeCode(code:string):string {
  return code.split('\n').map(line=>line.trimEnd()).filter(line=>line.trim().length>0).join('\n');
}
