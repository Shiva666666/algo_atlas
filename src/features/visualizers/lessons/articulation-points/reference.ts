export const AP = `from collections import defaultdict
class Solution:
    def articulationPoints(self, V: int, edges: list[list[int]]) -> list[int]:
        adj_list = defaultdict(list)
        for edge in edges:
            v1, v2 = edge
            adj_list[v1].append(v2); adj_list[v2].append(v1)
        seen = set(); timer = 0
        low = [0] * V; discovery_time = [0] * V; articulation = set()
        def dfs(curr, parent):
            nonlocal timer
            seen.add(curr); discovery_time[curr] = timer; low[curr] = timer; timer += 1
            children = 0
            for v in adj_list[curr]:
                if v not in seen:
                    children += 1; dfs(v, curr); low[curr] = min(low[curr], low[v])
                    if parent != -1 and low[v] >= discovery_time[curr]: articulation.add(curr)
                elif v != parent: low[curr] = min(low[curr], discovery_time[v])
            if parent == -1 and children > 1: articulation.add(curr)
        for i in range(V):
            if i not in seen: dfs(i, -1)
        if not articulation: return [-1]
        return sorted(articulation)`;
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
