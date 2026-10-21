# Rate limiting

> Why services limit request rates, the common algorithms (fixed window, sliding window, token bucket, leaky bucket), where to enforce it, and distributed rate limiting with a shared store.

## Why rate limit

✍️ Limiting request rate protects backend capacity from overload, blunts abuse (scraping, brute force, DDoS), and enforces fair-use quotas and paid tiers. The usual response is HTTP **429 Too Many Requests** with a `Retry-After` header.

## Fixed and sliding window

✍️ **Fixed window:** count requests per clock interval (e.g. per minute); reset at the boundary. Simple but lets a client burst at the end of one window and start of the next (~2× the limit).
✍️ **Sliding window:** count over a moving interval (log of timestamps or a weighted blend of the current and previous window) to smooth that edge.

## Token and leaky bucket

✍️ **Token bucket:** tokens refill at a steady rate up to a capacity; each request spends one; an empty bucket rejects. Allows controlled bursts — the common default.
✍️ **Leaky bucket:** requests enter a fixed-size queue drained at a constant rate; overflow is dropped. Produces a smooth, steady output.
```java
boolean allow(String key) {           // token bucket sketch
    Bucket b = buckets.get(key);
    b.refill();                       // add tokens by elapsed time
    return b.tokens-- > 0;            // reject when empty → 429
}
```

## Distributed rate limiting

✍️ With many app servers, per-node counters undercount the real total. Enforce at the **edge** (API gateway / LB) and keep counters in a **shared store** like Redis using atomic ops (`INCR` + `EXPIRE`, or a Lua token-bucket script) so every node sees the same count.
- Trade-off: a central store adds a network hop and is itself a dependency to make highly available.
