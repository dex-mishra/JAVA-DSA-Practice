# Web security basics

> The attacks every web app must defend against — injection, XSS, CSRF — plus transport, secrets and rate limiting, with the Java patterns that stop each one.

## Never trust input

✍️ Treat every client value as hostile. Validate type/length/range, and — critically — build SQL with **parameterised queries** so input is bound as data, never concatenated into the statement. JPA and `PreparedStatement` do this for you; hand-built SQL strings are where injection lives.

## XSS & CSRF

✍️ **XSS** (cross-site scripting): an attacker gets script into a page you serve, running in other users' browsers. Fix by **escaping output** and setting a Content-Security-Policy. **CSRF** (cross-site request forgery): a malicious page makes a logged-in user's browser send a request using its cookies. Fix with an anti-CSRF token and `SameSite` cookies.
- Mark auth cookies `HttpOnly` + `Secure` so script cannot read them.

## Transport, secrets & rate limiting

✍️ Serve everything over **HTTPS** so tokens and data are not sniffed. Hash passwords with **bcrypt/argon2** (slow + salted), never a fast hash. Keep secrets in env/vault config, not in source or git. **Rate-limit** login and expensive endpoints to blunt brute-force and abuse — the same throttle pattern used at the API gateway.

## Java defences

✍️ Spring Security wires up most of this; the SQL and hashing patterns are explicit.
```java
// Parameterised query — injection-safe
var q = em.createQuery("select u from User u where u.email = :e", User.class);
q.setParameter("e", email);

// Password hashing
var encoder = new BCryptPasswordEncoder();
String hash = encoder.encode(rawPassword);
boolean ok = encoder.matches(rawPassword, hash);
```
- For the throttling strategy itself, see rate limiting.
