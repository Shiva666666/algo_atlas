from typing import List

class Solution:
    def suggestedProducts(self, products: List[str], searchWord: str) -> List[List[str]]:
        trie = {}
        res = []

        # build trie
        for product in products:
            node = trie
            for char in product:
                if char not in node:
                    node[char] = {}
                node = node[char]
            node['$'] = product

        def dfs(word):
            node = trie
            for char in word:
                if char not in node:
                    return
                node = node[char]

            def collect(node):
                if len(temp) == 3:
                    return
                if '$' in node:
                    temp.append(node['$'])
                for char in sorted(node):
                    if char != '$':
                        collect(node[char])
            collect(node)

        # search each prefix
        for j in range(1, len(searchWord) + 1):
            temp = []
            dfs(searchWord[0:j])
            res.append(temp[:])

        return res
