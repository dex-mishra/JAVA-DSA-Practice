# Load balancing and proxies

> What a load balancer does, common algorithms, L4 vs L7, health checks, sticky sessions, and the difference between a forward and a reverse proxy.

## What a load balancer does

✍️ A load balancer is the single public entry point that spreads incoming requests across a pool of servers, so no one box is overwhelmed and failed boxes are routed around.
✍️ It also enables rolling deploys (drain a node, update, return it) and can terminate TLS centrally.

## Balancing algorithms

✍️ **Round-robin:** next server in order — simple, assumes equal requests. **Least-connections:** send to the server with fewest active connections — better when request cost varies. **Weighted:** bias toward beefier machines. **Consistent/IP hash:** `hash(key) → server`, keeping a given key on the same node (cache affinity, sharding).

## L4 vs L7

✍️ **L4 (transport):** balances TCP/UDP by IP/port, content-blind, very fast. **L7 (application):** understands HTTP, so it can route by path/host/header, do TLS termination, and apply per-route rules — at higher cost.
```java
// L7 routing idea the LB performs
if (path.startsWith("/api/")) forward(apiPool);
else if (path.startsWith("/img/")) forward(staticPool);
```

## Health checks and sticky sessions

✍️ **Health checks:** the LB periodically pings a `/health` endpoint and removes nodes that fail, so traffic only goes to live servers.
- **Sticky sessions** pin a client to one server via a cookie. They let you keep in-memory session state but break clean horizontal scaling and hurt failover — prefer a stateless design with shared session storage.

## Reverse vs forward proxy

✍️ A **reverse proxy** sits in front of your servers and faces clients (a load balancer, CDN edge, or NGINX doing TLS/caching). A **forward proxy** sits in front of clients and faces the internet (corporate egress, content filtering). A load balancer is a specialized reverse proxy.
