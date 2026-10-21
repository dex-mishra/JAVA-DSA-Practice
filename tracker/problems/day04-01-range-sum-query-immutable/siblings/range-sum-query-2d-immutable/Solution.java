// Range Sum Query 2D - Immutable
// https://leetcode.com/problems/range-sum-query-2d-immutable/
import java.util.*;

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
