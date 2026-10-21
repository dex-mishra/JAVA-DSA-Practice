# Spiral order — shrinking boundaries

> Keep top, bottom, left, right boundaries; walk the four sides of the current layer and shrink the boundaries after each side.

## Idea

✍️ The spiral visits the outer ring, then the next ring, and so on. Represent the unvisited region as a rectangle `[top, bottom] × [left, right]`.
✍️ Walk right along `top`, then `top++`; down along `right`, then `right--`; left along `bottom`, then `bottom--`; up along `left`, then `left++`. Stop when the rectangle is empty.

## Template

```java
List<Integer> spiralOrder(int[][] g) {
    List<Integer> out = new ArrayList<>();
    int top = 0, bot = g.length - 1, left = 0, right = g[0].length - 1;
    while (top <= bot && left <= right) {
        for (int c = left; c <= right; c++) out.add(g[top][c]);
        top++;
        for (int r = top; r <= bot; r++) out.add(g[r][right]);
        right--;
        if (top <= bot) {                            // a row is still left
            for (int c = right; c >= left; c--) out.add(g[bot][c]);
            bot--;
        }
        if (left <= right) {                         // a column is still left
            for (int r = bot; r >= top; r--) out.add(g[r][left]);
            left++;
        }
    }
    return out;
}
```

## Pitfalls

✍️ The two `if` guards prevent re-visiting the middle row or column of non-square matrices (e.g. a single row, or 3×5). Test a 1×4 and a 4×1 matrix.

## Complexity

O(R·C) time, O(1) extra space besides the output.
