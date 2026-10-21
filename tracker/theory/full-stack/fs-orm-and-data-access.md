# ORM & data access

> What an ORM buys you and what it costs, the N+1 query trap, transactions and the repository pattern, and when to drop to raw SQL — shown with JPA/Hibernate.

## What an ORM does

✍️ An **Object-Relational Mapper** maps database rows to objects and back, so you query with method calls and objects instead of hand-written SQL. In Java the standard is **JPA**, implemented by **Hibernate**. You get less boilerplate, compile-time type safety, and DB portability — at the cost of SQL being generated out of sight.

## The N+1 trap

✍️ The classic ORM pitfall: fetch a list of orders (1 query), then touch each order's customer, triggering a **lazy** query per row — N more. 100 orders = 101 queries.
- Fix with an eager **join fetch** (`JOIN FETCH o.customer`), an `@EntityGraph`, or batch fetching. Always inspect the SQL the ORM actually emits.

## Transactions & repositories

✍️ Group related writes in a **transaction** so they commit atomically or roll back together. Hide persistence behind a **repository** so the rest of the app depends on an interface, not on JPA.
```java
@Transactional
public void placeOrder(Order o) {
  orders.save(o);          // repository
  inventory.reserve(o);    // both commit, or neither does
}
```

## JPA entity & query

✍️ A mapped entity plus a Spring Data repository; note the explicit fetch to dodge N+1.
```java
@Entity
class Order {
  @Id @GeneratedValue Long id;
  @ManyToOne(fetch = FetchType.LAZY) Customer customer;
}
interface OrderRepo extends JpaRepository<Order, Long> {
  @Query("select o from Order o join fetch o.customer")
  List<Order> findAllWithCustomer();
}
```
- For a store choice behind all this, see SQL vs NoSQL.
