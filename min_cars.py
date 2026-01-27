import math
def min_cars(races):
    n =len(races)
    races.sort(key = lambda r: r[2])
    
    graph = [[] for _ in range(n)]
    for i in range(n):
        for i jin range(i+1, n):
            x1, y1, d1 = races[i]
            x2, y2, d2 = races[j]
            dist = math.hypot(x1- x2, y1- y2)
            if d2- d1 >= dist:
                graph[i].append(j)
                
    matchR = [-1]*n
    def bpm(u, seen):
        for v in graph[u]:
            if not seen[v]:
                seen[v] = True
                if matchR[v] == -1 or bpm(matchR[v], seen):
                    matchR[v] = u
                    return True
            return False
        result = 0
        for i in range(n):
            seen = [False]*n
            if bpm(u, seen):
                result += 1
        return n - result
N = int(input())
races = [tuple(map(int, input(). split())) for i in range(N)]
print(min_cars(races))