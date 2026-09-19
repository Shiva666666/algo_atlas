from typing import List


class Solution:
    def findTheCity(self, n: int, edges: List[List[int]], distanceThreshold: int) -> int:
        distance = [[float("inf")] * n for _ in range(n)]
        for city in range(n):
            distance[city][city] = 0
        for start, end, weight in edges:
            distance[start][end] = min(distance[start][end], weight)
            distance[end][start] = min(distance[end][start], weight)

        for middle in range(n):
            for start in range(n):
                for end in range(n):
                    distance[start][end] = min(
                        distance[start][end],
                        distance[start][middle] + distance[middle][end],
                    )

        answer = -1
        fewest = float("inf")
        for city in range(n):
            reachable = sum(
                city != other and distance[city][other] <= distanceThreshold
                for other in range(n)
            )
            if reachable <= fewest:
                fewest = reachable
                answer = city
        return answer
