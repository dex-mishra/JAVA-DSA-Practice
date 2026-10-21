# Abstraction, abstract classes and interfaces

> Expose what an object does and hide how it does it. Abstract methods, abstract classes, Java interfaces (and default methods), how they differ, and how abstraction lets you swap implementations.

## What abstraction is

✍️ **Abstraction** means showing only the essential behaviour of something and hiding the details of how it works.
✍️ You drive a car through a steering wheel and pedals without knowing how fuel injection works; code calls `pay(amount)` without knowing whether it is UPI or a card.
✍️ In code, abstraction is achieved through **interfaces / abstract classes** (and also simply through well-designed methods and classes).

## Abstract methods and abstract classes

✍️ `abstract double area();` declares a method every concrete subclass must provide (no body here).
✍️ A class declared `abstract` **cannot be instantiated**: you cannot write `new Shape()`, but a variable of type `Shape` can reference a subclass object.
✍️ An abstract class can still have constructors, fields and normal implemented methods — it is a partial blueprint.
- Java methods are virtual by default, so an overriding method in a subclass is always dispatched dynamically; mark a method `final` to forbid overriding.
- Unlike C++, you do not (and cannot) declare a destructor; cleanup is the GC's job or `AutoCloseable`.

## Interfaces in Java

✍️ Java has the `interface` keyword. Before Java 8 an interface held only abstract methods (implicitly `public abstract`) and constants (`public static final`); since Java 8 it may also have `default` and `static` methods with bodies.
✍️ A class can `implement` several interfaces, gaining several capabilities (`class File implements Readable, Writable`), even though it may `extend` only one class — this is how Java does multiple inheritance of type without the diamond problem.
- An interface cannot hold instance state; that is the main thing that still separates it from an abstract class.

## Abstraction vs encapsulation

✍️ Abstraction answers **what** a caller can do (design level: the interface).
✍️ Encapsulation answers **how** an object protects its state (implementation level: private fields + methods).
✍️ They work together: an interface (abstraction) is implemented by classes that keep their state private (encapsulation).

## Why it matters (and the link to LLD)

✍️ Code that depends on an interface does not change when a new implementation is added — add `class Wallet implements PaymentMethod` and `checkout` stays the same.
✍️ This is the **Dependency Inversion** principle (the D in SOLID): depend on abstractions, not on concrete classes. It is the foundation of most LLD designs.
- It also makes testing easy: pass a fake implementation of the interface (or a mock).

## Interview questions

✍️ **Q: Can you create an object of an abstract class or interface?** No; but a reference of that type can point to a concrete subclass/implementor.
✍️ **Q: Can an abstract class have a constructor?** Yes, to initialise its own part of a subclass object.
✍️ **Q: When would you choose an abstract class over an interface?** When related classes share state or code; an interface when unrelated classes share only a capability, or when you need to implement several.
- **Q: Give a real example of abstraction.** A payment gateway, a logger with file/console back-ends, a database driver (JDBC).
