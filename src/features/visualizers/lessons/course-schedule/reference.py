from collections import defaultdict, deque

class Solution:
    def findOrder(self, numCourses: int, prerequisites: list[list[int]]) -> list[int]:
        indegree = [0]*numCourses
        adj_list = defaultdict(list)
        queue = deque()
        res = []
        for a,b in prerequisites:
            indegree[a] += 1
            adj_list[b].append(a)

        if 0 not in set(indegree):
            return []

        for i in range(len(indegree)):
            if indegree[i] == 0:
                queue.append(i)

        while queue:
            node = queue.popleft()
            res.append(node)
            for nxt in adj_list[node]:
                indegree[nxt] -= 1
                if indegree[nxt] == 0:
                    queue.append(nxt)

        return res if len(res) == numCourses else []
