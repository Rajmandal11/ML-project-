def smallest_region(rects, outer):
    ox1, oy1, ox2, oy2 = outer

    # Find valid vertical folds
    valid_x = []
    for x in range(ox1 + 1, ox2):
        if all(not (r[0] < x < r[2]) for r in rects):
            valid_x.append(x)

    # Find valid horizontal folds
    valid_y = []
    for y in range(oy1 + 1, oy2):
        if all(not (r[1] < y < r[3]) for r in rects):
            valid_y.append(y)

    # Combine all folds with outer boundaries
    xs = [ox1] + valid_x + [ox2]
    ys = [oy1] + valid_y + [oy2]

    xs.sort()
    ys.sort()

    # Find smallest gap
    min_dx = min(xs[i+1] - xs[i] for i in range(len(xs)-1))
    min_dy = min(ys[i+1] - ys[i] for i in range(len(ys)-1))

    return min_dx * min_dy
