# The Arrays / Collections / Stream helpers worth knowing

> binarySearch, sort, stream sum, max, reverse, fill, distinct and the TreeSet navigation methods — what each does and what it costs.

## The list

| Helper | Does | Cost |
|---|---|---|
| `Arrays.binarySearch(a, x)` | index of x in a **sorted** array; `-(insertionPoint)-1` if absent | O(log n) |
| `TreeSet.ceiling(x)` / `higher(x)` | first ≥ x / first > x (the lower_bound/upper_bound equivalents) | O(log n) |
| `Arrays.stream(a).sum()` / `.asLongStream().sum()` | sum (use the long stream to avoid int overflow!) | O(n) |
| `Arrays.stream(a).max().getAsInt()` / `.min()` | largest / smallest value | O(n) |
| `Collections.reverse(list)` | reverse in place | O(n) |
| `Arrays.fill(a, v)` | fill with v | O(n) |
| `Arrays.stream(a).distinct().toArray()` | distinct values (any order) | O(n) |
| `Collections.sort(list)` / `Arrays.sort(a)` | sort ascending | O(n log n) |
| `Arrays.stream(a).filter(v -> v == x).count()` | occurrences of x | O(n) |

## Turning a search result into an index

✍️ `int pos = Arrays.binarySearch(a, x);` — if `pos < 0`, the insertion point is `-(pos) - 1` (where x would go to keep the array sorted). For a "first element ≥ x" over a collection, prefer a `TreeSet` and `ceiling(x)`, which returns `null` when every element is < x.

## The distinct idiom

```java
int[] distinct = Arrays.stream(a).sorted().distinct().toArray();
// distinct now holds the unique values, sorted
```
Unlike C++'s `unique` (which only drops *adjacent* duplicates and needs a prior sort), `Stream.distinct()` removes all duplicates regardless of order; chaining `.sorted()` first gives the sorted-unique array in one expression.

## The sum-overflow trap

✍️ `Arrays.stream(a).sum()` sums in `int`, so it overflows on large inputs. Use `Arrays.stream(a).asLongStream().sum()` to accumulate in `long` — the Java equivalent of C++'s `0LL` initial value.
