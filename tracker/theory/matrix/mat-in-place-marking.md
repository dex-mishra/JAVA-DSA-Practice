# In-place marking in matrices

> Use the first row and column (or a sentinel value) as storage to mark rows/columns, achieving O(1) extra space.

## Idea

✍️ Set matrix zeroes (LeetCode 73): you need to remember which rows and columns contain a zero. O(R + C) space with two boolean arrays.
✍️ O(1) space: store those flags **in row 0 and column 0** themselves (`m[r][0] = 0` marks row r, `m[0][c] = 0` marks column c). Remember separately whether row 0 / column 0 originally had a zero.

## Order of operations

✍️ 1. Record whether row 0 and column 0 contain zeros (two booleans).
✍️ 2. Mark: for every zero at (r, c) with r, c ≥ 1, set `m[r][0] = m[0][c] = 0`.
✍️ 3. Fill: for r, c ≥ 1, zero the cell if its row marker or column marker is 0.
✍️ 4. Finally zero row 0 / column 0 if the booleans say so. Doing step 4 earlier destroys the markers.

## Other marking tricks

- Grid DFS often marks visited cells by overwriting them ('1' → '0' in Number of Islands, 'O' → '#' in Surrounded Regions) instead of a separate visited array. Ask whether modifying the input is allowed.
- Game of Life: encode "was alive, now dead" as a third state (e.g. 2) so the old value can still be recovered in one pass.
