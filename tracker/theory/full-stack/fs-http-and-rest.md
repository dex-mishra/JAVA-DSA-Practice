# HTTP & REST

> The request/response model, the methods and status codes that matter, what makes an API RESTful, and how a Java backend maps all of it to resource endpoints.

## The request/response model

✍️ HTTP is a **stateless** protocol: the client sends a request (method + URL + headers + optional body), the server returns a response (status line + headers + body). Nothing is remembered between requests unless you add cookies, tokens, or a session store. This is why REST APIs scale horizontally — any server can handle any request.

## Methods & idempotency

✍️ **GET** reads (safe, idempotent, cacheable). **POST** creates or triggers (not idempotent). **PUT** replaces a resource (idempotent). **PATCH** partially updates. **DELETE** removes (idempotent). Idempotent = repeating the call leaves the same end state, which matters for safe client retries.

## What makes it REST

✍️ REST models the domain as **resources** addressed by URLs (`/users/42`), acted on by HTTP verbs, exchanged as representations (usually JSON). Rules: stateless, uniform interface, nouns in paths not verbs (`POST /orders`, not `/createOrder`), and correct status codes.
- Good: `GET /users/42/orders`. Bad: `GET /getOrdersForUser?id=42`.

## A resource endpoint in Java

✍️ Spring maps verbs and paths to methods; the framework handles JSON (de)serialisation.
```java
@RestController
@RequestMapping("/users")
class UserController {
  private final UserService svc;
  @GetMapping("/{id}")
  User get(@PathVariable long id) { return svc.find(id); }
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED) // 201
  User create(@RequestBody NewUser body) { return svc.create(body); }
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT) // 204
  void delete(@PathVariable long id) { svc.delete(id); }
}
```
