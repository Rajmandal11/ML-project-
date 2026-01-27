from itertools import combinations

def orientation(p, q, r):
    val = (q[1]-p[1]) * (r[0]-q[0]) - (q[0]-p[0]) * (r[1]-q[1])
    if abs(val) < 1e-9:
        return 0
    return 1 if val > 0 else 2

def on_segment(p, q, r):
    return (min(p[0], r[0]) <= q[0] <= max(p[0], r[0]) and
            min(p[1], r[1]) <= q[1] <= max(p[1], r[1]))

def intersect(p1, q1, p2, q2):
    o1 = orientation(p1, q1, p2)
    o2 = orientation(p1, q1, q2)
    o3 = orientation(p2, q2, p1)
    o4 = orientation(p2, q2, q1)
    if o1 != o2 and o3 != o4:
        return True
    if o1 == 0 and on_segment(p1, p2, q1): return True
    if o2 == 0 and on_segment(p1, q2, q1): return True
    if o3 == 0 and on_segment(p2, p1, q2): return True
    if o4 == 0 and on_segment(p2, q1, q2): return True
    return False

def main():
    n = int(input().strip())
    sticks = [tuple(map(int, input().split())) for _ in range(n)]

    # Build connectivity graph (adjacency)
    adj = {}
    points = set()

    for x1, y1, x2, y2 in sticks:
        p1, p2 = (x1, y1), (x2, y2)
        points.update([p1, p2])
        adj.setdefault(p1, set()).add(p2)
        adj.setdefault(p2, set()).add(p1)

    # If we can find any cycle → closed figure
    visited = set()
    parent = {}

    def dfs(u, p):
        visited.add(u)
        for v in adj[u]:
            if v == p:
                continue
            if v in visited:
                return True  # cycle found
            parent[v] = u
            if dfs(v, u):
                return True
        return False

    found_cycle = False
    for node in points:
        if node not in visited:
            if dfs(node, None):
                found_cycle = True
                break

    if found_cycle:
        print("Kalyan")
    else:
        print("Abandoned")

if __name__ == "__main__":
    main()
