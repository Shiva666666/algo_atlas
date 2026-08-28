# preprocess
n, k = map(int, input().split())

cost = []
for i in range(n):
    cost.append(list(map(int, input().split())))

queries_length = int(input())
queries = []

for i in range(queries_length):
    queries.append(list(map(int, input().split())))

# floyd for all source shortest path matrix, can use all source dijkstra too maybe time is same idk, GPT says dijkstras is O(N(ElogN)) for all pairs
# makes sense so for all pairs in a dense complete graph it might be O(N**3logN) as E becomes N**2
# floyd is a standard N**3
# The reason we do not miss it is that Floyd's DP state is not "use exactly k." It is: shortest path from i to j using only intermediates 0...k
for intermediate_vertex in range(n):
    for current_vertex in range(n):
        for final_vertex in range(n):
            cost[current_vertex][final_vertex] = min(
                cost[current_vertex][final_vertex],
                cost[current_vertex][intermediate_vertex]
                + cost[intermediate_vertex][final_vertex],
            )

# stiener dp
INF = float("inf")
dp = [[INF] * n for _ in range(1 << k)]
dp[0] = [0] * n  # empty subset is 0

for t in range(k):
    dp[1 << t][t] = 0  # when only terminal is requried (basecase) bottom of our tree cost is 0

for mask in range(1, 1 << k):
    sub = mask
    while True:
        other = mask ^ sub
        for v in range(n):
            dp[mask][v] = min(
                dp[mask][v],
                dp[sub][v] + dp[other][v],
            )  # merging two subsets which are mutually exclusive

        # this has to be outside the for v loop
        if sub == 0:
            break
        sub = (sub - 1) & mask

    old = dp[mask][:]
    for u in range(n):
        for v in range(n):
            dp[mask][u] = min(dp[mask][u], old[v] + cost[v][u])

full_mask = (1 << k) - 1
answer = [[INF] * n for _ in range(n)]

# s can be any non-fixed terminal
for s in range(k, n):
    # ndp[mask][v] connects s, the fixed terminals in mask, and v
    ndp = [[INF] * n for _ in range(1 << k)]
    ndp[0][s] = 0

    for mask in range(1 << k):
        sub = mask
        while True:
            other = mask ^ sub
            for v in range(n):
                ndp[mask][v] = min(
                    ndp[mask][v],
                    ndp[sub][v] + dp[other][v],
                )

            if sub == 0:
                break
            sub = (sub - 1) & mask

        old = ndp[mask][:]
        for u in range(n):
            for v in range(n):
                ndp[mask][u] = min(
                    ndp[mask][u],
                    old[v] + cost[v][u],
                )

    for t in range(k, n):
        answer[s][t] = ndp[full_mask][t]

# queries use 1-based vertex numbering
for s, t in queries:
    print(answer[s - 1][t - 1])
