import heapq

class Solution:
    def scheduleCourse(self, courses: List[List[int]]) -> int:

        courses.sort(key = lambda x: x[1])
        heap = []
        total = 0

        for dur, lastday in courses:

            if lastday >=  total + dur:
                total += dur
                heapq.heappush(heap, -dur)
            else:
                if heap and -heap[0]>dur:
                    total += heapq.heappop(heap)
                    total+=dur
                    heapq.heappush(heap, -dur)


        return len(heap)
