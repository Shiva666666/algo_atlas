export const V = `#from collections import defaultdict, deque
class Solution:
    def findSmallestSetOfVertices(self, n: int, edges: List[List[int]]) -> List[int]:
        idx = [0]*n
        for edge in edges:
            frm, to = edge; idx[to]+=1
        res = []
        for i in range(n):
            if idx[i] == 0: res.append(i)
        return res`;
