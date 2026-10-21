# Classes, objects and what they look like in memory

> A class is a blueprint, an object is one instance on the heap. Know class vs object, the object header and field layout, where methods and static fields live, the this reference, and how the JVM allocates and garbage-collects objects.

## Class and object

✍️ A **class** describes a type: what data each instance holds (fields) and what it can do (methods).
✍️ An **object** is one instance created with `new`, living on the heap, with its own copy of every instance field. The variable you assign holds a **reference** to that object.
- Analogy: a class is the form for an account; each filled-in form is an object, and a reference is the address where that form is filed.

## No struct in Java: classes and records

✍️ Java has no `struct`. A plain data bundle is just a `class` (or, since Java 16, a `record` that auto-generates the constructor, accessors, `equals`/`hashCode`/`toString`).
✍️ Unlike C++, there is no public-by-default aggregate: field access is controlled by `public`/`protected`/package-private/`private` modifiers you write explicitly ([[oop-encapsulation-access]]).
- Convention: a `record` for immutable data carriers (a Point, a Node), a `class` when the type protects invariants or is mutable.
- Interview trap: "Can a Java class have constructors, methods, inheritance?" — yes; a `record` can have methods and implement interfaces but cannot extend another class and has final fields.

## Object layout: header, fields and alignment

✍️ A Java object is an **object header** followed by its **instance fields**. On the HotSpot JVM the header is a *mark word* (hashcode / lock / GC bits) plus a *class pointer*, roughly 12 bytes with compressed oops (16 without).
✍️ **Alignment**: the JVM aligns the whole object to an 8-byte boundary and may **reorder** fields (largest first) to pack them, so you do not hand-compute layout the way you would in C++.
```java
class A { char c; int x; }            // header + fields, padded to 8
class B { char c; double d; char e; } // the JVM reorders: double, int-sized gaps packed
class C { double d; char c; char e; } // same fields; size is JVM-decided, not source order
class E { }                            // just the header
```
✍️ There is no size operator; if you need the real footprint use the JOL (Java Object Layout) tool.
- If you only need a few fields, prefer primitives over boxed types (`int` not `Integer`) to avoid an extra object header per value.
- Exact sizes are JVM- and flag-dependent; say "on HotSpot with compressed oops" in interviews.

## Methods and static fields

✍️ Methods are compiled to bytecode **once** in the class metadata and shared by all instances. Calling `a.deposit(5)` passes the receiver `a` as the implicit `this`; the JVM resolves which method body to run (virtual dispatch for overridable methods).
✍️ A **static field** belongs to the class, not to any object: one copy shared by all instances, stored with the class — so it is not part of an object's footprint. Initialise it inline or in a `static { }` block.
✍️ A **static method** has no `this`, so it can only touch static members. Call it as `Account.count()`.
```java
class Account {
    private static int created;            // one copy for the class
    Account() { created++; }
    static int count() { return created; } // no this
}
```

## The this reference

✍️ Inside an instance method, `this` is a reference to the object the method was called on.
✍️ Uses: resolve name clashes (`this.balance = balance;`), return the object for chaining (`return this;`), pass the object to other methods.
- In Java every object is mutable through its reference unless you make fields `final`; there is no `const` method, so immutability is enforced by design (final fields, no setters), not by the language marking `this`.

## Where objects live: heap and garbage collection

✍️ In Java **every object lives on the heap**. `Account a = new Account(100);` allocates the object on the heap and stores a reference in `a` (the reference itself may sit on the stack).
✍️ There is no manual `delete`. The **garbage collector** reclaims an object once it is no longer reachable from any live reference. You never double-free, and you never leak in the C++ sense — though holding references longer than needed (e.g. in a static map) is the Java "leak".
✍️ For deterministic cleanup of non-memory resources (files, sockets), implement `AutoCloseable` and use try-with-resources instead of relying on `finalize` ([[oop-constructors-destructors]], Day 5).
- `new` = allocate on the heap + run the constructor. Primitives (`int i = 5;`) are not objects and are not allocated with `new`.

## Interview questions

✍️ **Q: Does an object store its methods?** No. The bytecode lives once in the class metadata; objects store only their fields (plus the header).
✍️ **Q: Does Java expose object size or manual padding control?** No — object size and field order are chosen by the JVM; use JOL to inspect.
✍️ **Q: new in Java vs C++?** Java `new` always allocates on the heap and the GC frees it; there is no `delete` and no stack-allocated objects.
- **Q: Can a static method be overridden or use `this`?** No — static methods are not virtual and have no `this` (they can be hidden, not overridden).
- **Q: How would you shrink an object's footprint?** Prefer primitives over boxed types, avoid unnecessary fields, and reuse immutable instances; field packing itself is the JVM's job.
