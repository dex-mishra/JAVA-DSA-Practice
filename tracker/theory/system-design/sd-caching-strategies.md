# Caching strategies

> Why and where to cache, read patterns (cache-aside, read-through) and write patterns (write-through, write-back), eviction policies, TTLs, and the stampede/thundering-herd problem.

## Why and where to cache

✍️ A cache stores hot data in a faster/closer layer to cut latency and offload the database. Common layers: **in-process** (fast, per-node, not shared), **distributed** (Redis/Memcached, shared), and **CDN/edge** (static assets near users).

## Read patterns

✍️ **Cache-aside (lazy):** the app checks the cache; on a miss it reads the DB, populates the cache, and returns. Most common and simple.
✍️ **Read-through:** the app only queries the cache, which fetches from the DB on a miss. Cleaner app code, needs cache support.
```java
String v = cache.get(key);
if (v == null) {            // cache-aside
    v = db.load(key);
    cache.set(key, v, Duration.ofMinutes(10)); // TTL
}
return v;
```

## Write patterns

✍️ **Write-through:** write cache and DB together — consistent, slower writes. **Write-back (write-behind):** write cache now, flush to DB asynchronously — fast but risks loss if the cache fails before flushing. A common safe default is write-through plus cache-aside reads, or simply invalidate the key on write.

## Eviction and TTL

✍️ Caches are bounded, so they evict. **LRU** drops least-recently-used; **LFU** drops least-frequently-used. A **TTL** auto-expires entries so stale data can't live forever.
- Short TTL = fresher but more misses; long TTL = cheaper but staler.

## The stampede problem

✍️ When a hot key expires, many concurrent requests miss at once and all hit the DB (thundering herd). Mitigate with a **single-flight lock** (one request refills, others wait), **early/background refresh** before expiry, or slightly randomized TTLs to avoid synchronized expiration.
