

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