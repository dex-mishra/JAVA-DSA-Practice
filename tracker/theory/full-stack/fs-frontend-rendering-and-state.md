# Frontend rendering & state

> Server-side vs client-side rendering, what 'state' means on the client, keeping server and client data in sync, and how a Java backend serves each model.

## SSR vs CSR

✍️ **Server-side rendering** builds the full HTML on each request (classic Thymeleaf/JSP, or Next.js): quick first paint, SEO-friendly, but the server does the work every time. **Client-side rendering** ships a JS bundle that fetches JSON and renders in the browser: a slower first load but snappy, app-like interaction afterward. Many apps mix both (hydration).

## What client state is

✍️ 'State' is just the data the UI draws from. Two kinds: **server state** (a cached copy of data the backend owns) and **local UI state** (form text, open menus, selected tab). Keeping them separate and having one **source of truth** prevents the UI from showing contradictory things.
- Rule of thumb: derive what you can; store only what you must.

## Keeping them in sync

✍️ The hard part is staleness: the browser's copy drifts from the server. Reconcile by refetching on focus, invalidating a cache after a mutation, or doing **optimistic updates** (show the change immediately, roll back if the server rejects it). The REST contract (status codes, idempotent retries) is what makes this safe.

## Serving each model

✍️ One Java backend can serve both: a REST endpoint for the CSR app and a rendered template for SSR.
```java
// CSR: return JSON for the browser to render
@GetMapping("/api/orders")
List<Order> list() { return svc.all(); }

// SSR: server builds the view
@GetMapping("/orders")
String page(Model model) {
  model.addAttribute("orders", svc.all());
  return "orders"; // orders.html template
}
```
