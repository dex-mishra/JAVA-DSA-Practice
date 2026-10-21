# Client–server basics and how systems scale

> How a request flows from client to server, vertical vs horizontal scaling, stateless services, and why statelessness is what lets you add machines.

## How a request flows

✍️ A typical read: browser resolves the host via **DNS**, hits a **load balancer**, which forwards to one **app server**; the app talks to a **database** or **cache** and returns a response.
✍️ Each hop is a place to add capacity or fail — this is the map you reason over in a design interview.

## Scale up vs scale out

✍️ **Vertical (up):** give one machine more CPU/RAM. Easy, no code changes, but has a hardware ceiling and remains a single point of failure.
✍️ **Horizontal (out):** run many machines behind a load balancer. Near-unlimited and fault-tolerant, but requires the app to be stateless and introduces coordination concerns (shared data, caching).

## Stateless services

✍️ A **stateless** app server keeps no per-request client state in local memory. Session data lives in the client (a signed **JWT**) or a shared store (**Redis**, DB).
✍️ Because any instance can serve any request, you can add or remove instances behind the LB freely — the foundation of horizontal scaling and zero-downtime deploys.
```java
// Stateless: resolve the user from the token on every request
User user = jwt.verify(request.header("Authorization"));
// Avoid: storing login state in a server-local HashMap/HttpSession
```

## Where the bottleneck moves

✍️ Once app servers are stateless and horizontally scaled, the **database** usually becomes the bottleneck. The next moves are caching (read load), replication (read scaling), and sharding (write/storage scaling) — covered in later pages.
