# Implicit graphs — BFS over states

> When vertices are states (words, lock combinations, board positions) and edges are allowed moves, generate neighbours on the fly and BFS for the minimum number of moves.

## Idea

✍️ Not every graph is given as a list. "Change one letter at a time", "turn one wheel of a lock", "swap two tiles" define edges between **states**.
✍️ BFS from the start state, generating each state's neighbours when it is popped, with a visited set of states. The BFS level at which the target appears is the minimum number of moves.

## Example: word ladder

✍️ State = a word. Neighbours = words in the dictionary differing by one letter. Generate them by changing each position to 'a'..'z' and checking the dictionary set: O(L · 26) per word, instead of comparing against every word.
✍️ Remove a word from the dictionary set when it is first visited — that doubles as the visited set.

## Tips

✍️ Encode states compactly (string, or an integer) so the visited set is fast.
- Bidirectional BFS (from both ends, always expanding the smaller frontier) cuts the explored states dramatically for word ladder.
- Open the lock (LeetCode 752): states are 4-digit strings, deadends are pre-marked visited.

## Complexity

O(states × neighbours per state × cost to build a neighbour).
