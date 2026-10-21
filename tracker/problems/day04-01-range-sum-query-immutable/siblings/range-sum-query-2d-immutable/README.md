# Range Sum Query 2D - Immutable

**LeetCode:** [304. Range Sum Query 2D - Immutable](https://leetcode.com/problems/range-sum-query-2d-immutable/) (Medium)  
**Tier:** optional  
**How it maps from Range Sum Query - Immutable:** The same idea in two dimensions with inclusion–exclusion.

## Analyse

✍️ Many queries for the sum of a sub-rectangle of a static matrix.

## Brainstorm

✍️ Per-query double loop → O(R·C) per query. 2D prefix P[r+1][c+1] = sum of rectangle (0,0)..(r,c) → O(1) per query.

## Algorithm in words

✍️ Build P with "add up, add left, subtract the overlap"; answer with four lookups.

## Pseudocode

```
P[r+1][c+1] = g[r][c] + P[r][c+1] + P[r+1][c] - P[r][c]
sum = P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]
```

## Reference Java

```java
class NumMatrix {
    private long[][] P;
    public NumMatrix(int[][] g) {
        int R = g.length, C = g[0].length;
        P = new long[R + 1][C + 1];
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                P[r + 1][c + 1] = g[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c];
    }
    public int sumRegion(int r1, int c1, int r2, int c2) {
        return (int)(P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1]);
    }
}
```

## Quick theory

✍️ Inclusion–exclusion in both the build and the query ([[ps-2d-prefix-sum#query]]).
