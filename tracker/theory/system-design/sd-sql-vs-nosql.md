# SQL vs NoSQL

> Relational vs non-relational trade-offs, ACID vs BASE, the main NoSQL families, when each fits, and why the honest answer is usually 'it depends on the access pattern'.

## Relational (SQL)

✍️ Data in tables with a fixed schema and relationships; query with SQL and **joins**. Strong **ACID** transactions make it the default for money, inventory, and anything needing correctness and ad-hoc querying. Scaling writes beyond one machine is harder (needs sharding).

## Non-relational (NoSQL)

✍️ Schema-flexible stores built to scale out horizontally. Families: **key-value** (Redis/Dynamo — fast lookups, sessions), **document** (MongoDB — nested JSON records), **wide-column** (Cassandra — huge write-heavy tables), **graph** (Neo4j — relationship-centric queries). You usually denormalise and design tables around one query shape.

## ACID vs BASE

✍️ **ACID:** Atomic, Consistent, Isolated, Durable — correctness-first, typically strong consistency. **BASE:** Basically Available, Soft state, Eventually consistent — availability-first, accepts temporary staleness (ties back to CAP/PACELC).
- Pick ACID when a wrong value is unacceptable; BASE when availability and scale matter more than instant consistency.

## How to choose

✍️ Decide by **access pattern** and **consistency need**, not by trend. Relational joins and transactions, moderate scale → SQL. Massive scale, simple key lookups or denormalised documents, high write volume, flexible schema → NoSQL. Polyglot persistence (SQL for orders, Redis for sessions, a search index for text) is common.
```java
// Pick the store per workload
orders = postgres;   // transactional, relational
sessions = redis;    // ephemeral key-value
activityFeed = cassandra; // write-heavy, denormalised
```
