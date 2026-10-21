# Greedy with running balance (gas station, parentheses with wildcards)

> Track a running surplus; when it goes negative, the current start is impossible and the next index becomes the new start. Or track a range [low, high] of possible balances.

## Gas station

✍️ If total gas < total cost, no start works. Otherwise exactly one start works: walk once with a running tank; whenever the tank goes negative at i, no start between the current start and i can work, so set start = i + 1 and reset the tank.
```java
int canCompleteCircuit(int[] gas, int[] cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < gas.length; i++) {
        total += gas[i] - cost[i];
        tank += gas[i] - cost[i];
        if (tank < 0) { start = i + 1; tank = 0; }
    }
    return total < 0 ? -1 : start;
}
```

## Parentheses with '*' wildcards

✍️ Track the **range** of possible open counts `[lo, hi]`. '(' → lo++, hi++. ')' → lo−−, hi−−. '*' → lo−− (as ')'), hi++ (as '(').
✍️ If hi < 0 → too many ')' → false. Clamp lo at 0. At the end, valid iff lo == 0.

## Why it works (gas)

✍️ If you start at s and run dry at i, then every start between s and i also runs dry at or before i: they begin with an empty tank at a point where starting from s you had a non-negative surplus.
