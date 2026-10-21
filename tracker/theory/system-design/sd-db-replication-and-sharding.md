# Database replication and sharding

> Replication for read scaling and failover (leader–follower, replication lag), sharding for write/storage scaling, choosing a shard key, and the hot-shard and cross-shard pitfalls.

## Replication

✍️ Keep multiple copies of the same dataset. In **leader–follower**, the leader takes all writes and streams them to followers; reads fan out to followers. This scales **reads** and provides **failover** (promote a follower if the leader dies).
✍️ **Multi-leader / leaderless** setups accept writes in more places for availability but must resolve conflicts.

## Replication lag

✍️ Followers apply changes slightly after the leader, so a read on a follower can miss a just-made write (read-after-write anomaly).
- Fixes: route a user's reads to the leader right after they write, or track a version/timestamp and wait for the follower to catch up.
```java
if (justWrote(userId)) row = leader.read(id); // read-your-writes
else row = follower.read(id);                 // normal, may lag
```

## Sharding (partitioning)

✍️ Split the dataset across nodes so each holds a slice, keyed by a **shard key** — hash-based (even spread) or range-based (good for range scans). This scales **write throughput** and **storage** beyond one machine, since each shard handles its own writes.

## Choosing a shard key

✍️ A good key spreads load evenly and keeps related rows together. **Hot shard:** a key that concentrates traffic (sharding by day puts all of today's writes on one shard; a celebrity user overwhelms their shard). **Cross-shard queries/joins** fan out to every shard and are slow — design the key around your dominant access pattern.

## Do them in order

✍️ Replication is simpler and usually enough; reach for sharding only when a single node can no longer hold the write volume or data size, since sharding adds real operational and query complexity.
