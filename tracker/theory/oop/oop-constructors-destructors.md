# Constructors and object cleanup

> How objects are initialised and cleaned up in Java — constructor types, this(...) delegation and field-initialisation order, copy constructors (shallow vs deep), why there are no destructors, and AutoCloseable / try-with-resources instead of RAII.

## What a constructor does

✍️ A constructor runs automatically when an object is created with `new` and puts it into a valid starting state. It has the class's name and no return type (not even void).
✍️ If you write **no** constructor, the compiler generates a public no-arg default constructor. As soon as you write any constructor, that implicit default disappears — `new A()` stops compiling unless you add an explicit `A() {}`.
- There is no `explicit` keyword; Java never does implicit object conversions, so `Account a = 100;` simply does not compile.

## Kinds of constructors

✍️ **Default**: `A()` — no arguments.
✍️ **Parameterised**: `A(int x, String s)`.
✍️ **Copy**: Java has no built-in copy constructor, but the idiom is `A(A other) { this.x = other.x; ... }` to duplicate an object. (`Cloneable`/`clone()` exists but is shallow and widely discouraged.)
- **Overloading**: you can have several constructors with different parameter lists; a `new` call picks the matching one.
- Why pass the whole object to a copy constructor? Java passes the *reference* by value, so there is no infinite-recursion problem C++ has — the reference is just copied.

## this(...), super(...) and field initialisers

✍️ Java has no initialiser list. Instead you either initialise a field where it is declared (`private int x = 5;`), in an instance-initialiser block, or in the constructor body.
✍️ `this(args)` delegates to another constructor of the same class and must be the **first** statement; `super(args)` calls a superclass constructor (an implicit `super()` is inserted if you write neither).
✍️ `final` fields must be assigned exactly once by the time the constructor finishes — at declaration or in the constructor body.
- A field read before it is initialised sees its default (`0`/`null`/`false`), not a compile error, so ordering still matters.

## Initialisation order

✍️ First time the class is used: static fields and `static { }` blocks run once, in source order.
✍️ Per object: the superclass constructor runs first, then instance fields and instance-initialiser blocks in **declaration order**, then the body of the constructor you called.
✍️ There is no destruction order to manage — objects simply become eligible for GC when unreachable; any explicit cleanup you schedule with try-with-resources runs in reverse order of acquisition.

## Cleanup without destructors

✍️ Java has **no destructor**. Memory is reclaimed by the garbage collector some time after an object becomes unreachable — you cannot predict or force when.
✍️ `Object.finalize()` once offered a hook but is deprecated and unreliable (may never run); do not use it.
✍️ For files, sockets, locks and other non-memory resources, implement **`AutoCloseable`** and put a `close()` method that releases the resource, then open it in a try-with-resources so `close()` always runs.
- A `Cleaner` (java.lang.ref) is the modern last-resort safety net, but explicit `close()` is the correct pattern.

## Shallow vs deep copy

✍️ A field-by-field copy (what `clone()` does by default, or a naive copy constructor) copies **references**: the original and the copy share the same nested objects and arrays, so a change through one is visible through the other.
✍️ A **deep copy** also duplicates the nested objects (e.g. `data = other.data.clone()`, or copy each element) so the two objects are independent.
✍️ Prefer a **copy constructor** or a static factory over `Cloneable`/`clone()`, which is error-prone. For immutable types, copying is unnecessary — share the instance.
- There is no "rule of three": the GC removes the double-free hazard that motivates it in C++, so you only decide shallow vs deep based on whether the copy must be independent.

## try-with-resources (Java's RAII)

✍️ C++ RAII ties a resource to an object's destructor. Java has no destructors, so the equivalent is **try-with-resources**: `try (var in = new FileInputStream(path)) { ... }` calls `in.close()` automatically when the block exits, even if an exception is thrown.
✍️ Any class that implements `AutoCloseable` (or `Closeable`) works this way: streams, readers, `Scanner`, JDBC connections, locks wrapped in a closeable helper.
- Multiple resources in one `try` are closed in reverse order of opening.

## Interview questions

✍️ **Q: Can you call an overridable method from a constructor?** You can, but it is a trap: the subclass override runs while the subclass's own fields are still at their defaults (the object is only partially initialised). Prefer `private`/`final` methods in constructors.
✍️ **Q: Can a constructor be private?** Yes — used for singletons and static factory methods (the class controls its own instantiation).
✍️ **Q: Why no destructor in Java?** Automatic garbage collection manages memory; deterministic resource release is handled by `AutoCloseable` + try-with-resources instead.
- **Q: What does the compiler generate by default?** Only a no-arg constructor, and only if you declare no constructor at all. It does not generate copy constructors or `equals`/`hashCode` (a `record` does generate those).
- **Q: Difference between `this()` and `super()` in a constructor?** `this()` delegates to another constructor of the same class; `super()` invokes the superclass constructor. Either must be the first statement, so you cannot use both.
