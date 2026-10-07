from collections import deque

class Solution:
    def floodFill(self, image: list[list[int]], sr: int, sc: int, color: int) -> list[list[int]]:

        m = len(image)
        n = len(image[0])

        directions = [(0,1),(1,0),(-1,0),(0,-1)]

        change = image[sr][sc]

        queue = deque()
        queue.append((sr,sc))

        seen = set()

        while queue:

            row, col = queue.popleft()

            if (row, col) in seen:
                continue

            image[row][col] = color
            seen.add((row,col))

            for dr, dc in directions:
                nr, nc = row + dr, col + dc

                if 0<=nr<m and 0<=nc<n and image[nr][nc] == change and (nr,nc) not in seen:
                    queue.append((nr, nc))

        return image
