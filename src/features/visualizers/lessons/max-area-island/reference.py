class Solution:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:


        directions = [(0 , 1),(1 , 0),(0 , -1),(-1 , 0)]

        seen = set()

        def dfs(row, column):

            if grid[row][column] == 0:

                return 0

            seen.add((row, column))

            local_area = 1

            for r,c in directions:
                new_r, new_c= row+r, column+c

                if 0<=new_r<len(grid) and 0<=new_c<len(grid[0]) and (new_r, new_c) not in seen:
                    local_area+= dfs(new_r, new_c)


            return local_area


        max_area = 0

        for r in range(len(grid)):
            for c in range(len(grid[0])):

                if grid[r][c] == 1:
                    if (r,c) not in seen:
                        max_area = max(max_area,dfs(r,c))


        return max_area
