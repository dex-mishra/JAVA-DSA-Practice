# Auth: sessions vs JWT

> Server-side sessions versus stateless JWTs: where the trust lives, how each scales, revocation and logout trade-offs, and a Java sketch of both.

## Authn vs authz

✍️ **Authentication** proves identity (login). **Authorization** decides permissions (can this user delete that order?). Both schemes below solve the 'how do we remember you logged in' problem across HTTP's stateless requests.

## Server-side sessions

✍️ On login the server creates a session record (in memory, Redis, or a DB) and sends the client an opaque **session id** in an `HttpOnly` cookie. Each request the server looks the id up to find the user. Revoking is trivial — delete the record. Cost: every server needs to reach a shared session store, or you pin users to one server.

## Stateless JWTs

✍️ A **JSON Web Token** is `header.payload.signature`; the signature (HMAC or RSA) lets any server verify the claims without a lookup. The server stores nothing, which scales cleanly across many instances. The catch: you cannot easily invalidate a token before it expires.
- Mitigation: short-lived access tokens + a longer refresh token, or a small revocation denylist.

## Both in Java

✍️ Issue and verify a JWT with a library; sessions are built into the servlet container.
```java
// JWT issue + verify (jjwt)
String jwt = Jwts.builder()
    .subject(user.id())
    .expiration(Date.from(Instant.now().plus(15, MINUTES)))
    .signWith(key).compact();
var claims = Jwts.parser().verifyWith(key)
    .build().parseSignedClaims(jwt).getPayload();

// Session (Spring): server keeps the state, cookie holds JSESSIONID
request.getSession().setAttribute("userId", user.id());
```
