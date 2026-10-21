# Prefix and suffix passes — everything except me

> Answer "combine everything to my left with everything to my right" with one left-to-right pass and one right-to-left pass, without division.

## Idea

✍️ For each index i, the answer combines `left[i]` (all elements before i) and `right[i]` (all elements after i).
✍️ A forward pass fills `left`, a backward pass fills `right`, and the answer is `left[i] ⊕ right[i]` for whatever operation ⊕ is (sum, product, max).
✍️ To get O(1) extra space, write `left` directly into the output array, then sweep backwards with a single running `right` variable.

## Recognise it

✍️ "product of all elements except itself", "without using division", "trapping water" (max to the left and right), "candies with neighbours", "left max / right max".

## Template: product except self in O(1) extra space

```java
int[] productExceptSelf(int[] a) {
    int n = a.length;
    int[] out = new int[n];
    Arrays.fill(out, 1);
    for (int i = 1; i < n; i++) out[i] = out[i-1] * a[i-1];   // out[i] = product of a[0..i-1]
    int right = 1;
    for (int i = n - 1; i >= 0; i--) {
        out[i] *= right;                                       // times product of a[i+1..n-1]
        right *= a[i];
    }
    return out;
}
```

## Why not just divide?

✍️ total / a[i] breaks when a[i] = 0 (and with one zero, every other answer is 0; with two zeros, all answers are 0). The prefix/suffix method handles zeros with no special cases.

## Complexity

O(n) time, O(1) extra space besides the output.
