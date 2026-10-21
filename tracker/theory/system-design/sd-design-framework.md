# A framework for the design interview

> A repeatable order for a system design interview: clarify requirements, estimate scale, sketch the API and data model, draw the high-level design, then deep-dive and address bottlenecks.

## Clarify requirements

✍️ Pin down **functional** requirements (the features that must work) and **non-functional** ones (expected scale, latency targets, availability, consistency needs). Narrow scope explicitly — it is better to design two features well than ten vaguely.

## Estimate scale

✍️ Do a quick back-of-the-envelope: **QPS** (daily actions ÷ 86,400, times a peak factor), **read:write ratio**, **storage** (bytes/record × records × retention), and bandwidth. These numbers drive whether you need a cache, read replicas, or sharding.
```java
// e.g. 100M writes/day
double writeQps = 100_000_000.0 / 86_400;   // ~1,157/s
double peakQps  = writeQps * 3;              // headroom
```

## API and data model

✍️ List a handful of endpoints (`POST /tweet`, `GET /feed`) and the core entities and relationships. This grounds the design in concrete operations and exposes the main access patterns that decide SQL vs NoSQL and the shard key.

## High-level design

✍️ Draw the boxes and data flow: client → **load balancer** → stateless **services** → **cache** / **database**, plus a queue for async work.
- Keep it simple first, then justify each box from the requirements and estimates.

## Deep dive and bottlenecks

✍️ Pick one component (the feed generation, the counter, the dedup) and discuss its data structures and trade-offs in depth. Then name **bottlenecks** and **single points of failure**: scale reads with caching and replicas, scale writes with sharding or queues, and make the LB/DB redundant. Tie choices back to CAP/PACELC and the numbers you estimated.
