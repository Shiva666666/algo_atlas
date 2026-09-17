export const U = `class Solution:
    def maxLength(self, arr: List[str]) -> int:
        def backtrack(i, word):
            if i == len(arr): return len(word)
            temp = len(word); temp_set = set(word)
            for j in range(i+1, len(arr)):
                if len(set(arr[j])) == len(arr[j]) and temp_set.isdisjoint(set(arr[j])):
                    temp = max(temp, backtrack(j, word + arr[j]))
            return temp
        return backtrack(-1, "")`;
