from collections import deque
from typing import List


class Solution:
    def canVisitAllRooms(self, rooms: List[List[int]]) -> bool:
        queue = deque([0])
        seen = {0}

        while queue:
            room = queue.popleft()

            for key in rooms[room]:
                if key not in seen:
                    seen.add(key)
                    queue.append(key)

        return len(seen) == len(rooms)
