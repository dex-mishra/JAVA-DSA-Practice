# Rotating a matrix — transpose then reverse

> Rotate 90° clockwise in place = transpose (swap across the main diagonal) + reverse each row.

## Idea

✍️ Clockwise rotation sends (r, c) to (c, n−1−r).
✍️ Transpose sends (r, c) → (c, r). Then reversing each row sends (c, r) → (c, n−1−r). Together: exactly the rotation.
✍️ Counter-clockwise: transpose, then reverse each **column** (or reverse rows first, then transpose).

## Template

```java
void rotate(int[][] m) {
    int n = m.length;
    for (int r = 0; r < n; r++)
        for (int c = r + 1; c < n; c++) {    // c > r: swap each pair ONCE
            int t = m[r][c]; m[r][c] = m[c][r]; m[c][r] = t;
        }
    for (int[] row : m)
        for (int l = 0, rr = n - 1; l < rr; l++, rr--) { int t = row[l]; row[l] = row[rr]; row[rr] = t; }
}
```

## Pitfalls

✍️ Transpose loop must start at `c = r + 1`. Looping over all c swaps every pair twice and restores the original matrix.

## Complexity

O(n²) time (every cell moves), O(1) extra space.
