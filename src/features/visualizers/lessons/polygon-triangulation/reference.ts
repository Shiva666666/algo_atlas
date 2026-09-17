export const T = `class Solution:
    def minScoreTriangulation(self, values: List[int]) -> int:
        n = len(values); memo = {}
        def solve(i,j):
            if (j-i+1) < 3: memo[(i,j)] = 0; return 0
            if (i,j) in memo: return memo[(i,j)]
            for k in range(i+1, j):
                score = values[i]*values[k]*values[j] + solve(i,k) + solve(k,j)
                if (i,j) in memo: memo[(i,j)] = min(memo[(i,j)], score)
                else: memo[(i,j)] = score
            return memo[(i,j)]
        solve(0,n-1); return memo[(0,n-1)]`;
