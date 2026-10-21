# 2D prefix sums — rectangle sums in O(1)

> P[r][c] = sum of the rectangle from (0,0) to (r−1,c−1); any sub-rectangle sum is four lookups with inclusion–exclusion.

## Build

✍️ `P` has size (R+1) × (C+1), all zeros in row 0 and column 0.
✍️ `P[r+1][c+1] = g[r][c] + P[r][c+1] + P[r+1][c] − P[r][c]` (add the two overlapping rectangles, subtract the double-counted corner).

## Query

✍️ Sum of rows r1..r2, cols c1..c2 (inclusive) = `P[r2+1][c2+1] − P[r1][c2+1] − P[r2+1][c1] + P[r1][c1]`.
Draw the four rectangles once; it is the same inclusion–exclusion as the build.

## Where it appears

Range Sum Query 2D (LeetCode 304), maximal square checks, counting submatrices with a property, image blur filters.
