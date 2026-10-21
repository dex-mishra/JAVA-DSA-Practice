# Availability vs consistency — CAP and PACELC

> What CAP really says, why the real choice under a partition is C vs A, how PACELC adds the latency trade-off when there is no partition, and reading nines of availability.

## What CAP actually says

✍️ CAP: among **Consistency**, **Availability**, **Partition tolerance**, you can guarantee only two. In a real network partitions happen, so **P is not optional** — the design decision is C vs A *during a partition*.
✍️ **CP:** when nodes can't talk, refuse or stall writes/reads to never return wrong data. **AP:** keep answering using local data that might be stale, reconcile later.

## PACELC — the part CAP leaves out

✍️ PACELC: *if* **P**artition, choose **A** vs **C**; *else* (**E**, the common case) choose **L**atency vs **C**onsistency.
✍️ It names the everyday cost CAP ignores: strong consistency needs extra coordination round-trips, which adds latency even when nothing is broken.

## Strong vs eventual consistency

✍️ **Strong:** a read always sees the latest committed write (needs a leader/quorum). **Eventual:** replicas converge over time; a read may lag.
- Pick eventual for feeds, counters, caches; pick strong for money, inventory, unique constraints.

## Reading availability nines

✍️ Availability is uptime fraction. 99.9% ("three nines") ≈ 8.7 hours down/year; 99.99% ≈ 52 min; 99.999% ≈ 5 min. Each extra nine is roughly 10× less downtime and much more cost.
```java
// Eventual consistency in code: tolerate a stale read, confirm on the critical path
long views = cache.getOrDefault(postId, 0L); // may lag
if (isCheckout) views = db.readAuthoritative(postId); // pay for strong read only when it matters
```
