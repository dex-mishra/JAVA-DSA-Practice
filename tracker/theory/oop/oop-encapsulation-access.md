# Encapsulation and access control

> Bundle data with the methods that guard it, and hide the data so every change goes through those methods. Access modifiers, getters/setters that protect invariants, package-private access, and why encapsulation matters.

## What encapsulation is

✍️ **Encapsulation** = bundling data and the methods that operate on it into one unit, and **restricting direct access** to the data.
✍️ The class becomes the only code allowed to change its state, so it can guarantee its own rules (**invariants**): an account balance never goes negative, a date is always valid, a size always matches the stored elements.
- **Data hiding** (private fields) is the mechanism; encapsulation is the design principle.

## Why it matters

✍️ **Correctness**: invalid states cannot be created from outside — every change passes through checks.
✍️ **Freedom to change**: you can switch the internal representation (e.g. store balance in paise instead of rupees) without changing any calling code.
✍️ **Debugging**: if the data is wrong, only the class's own methods could have changed it.

## Access modifiers

✍️ `private`: accessible only inside the same class.
✍️ **package-private** (write no modifier): accessible to any class in the same package.
✍️ `protected`: accessible in the same package and in subclasses declared in other packages.
✍️ `public`: accessible everywhere.
- Access is checked at compile time per **class**, not per object: a method can read the private fields of *another* instance of the same class (that is how `equals` and copy constructors work).
- There is no inheritance "mode" as in C++; a subclass simply sees the `protected`/`public` members of its superclass.

## Getters, setters and real encapsulation

✍️ A getter exposes a value read-only.
✍️ A setter is only useful if it **validates** or keeps related fields consistent. Blind setters for every field are public data with extra steps.
✍️ Better: expose **behaviour**, not fields — `withdraw(amount)` instead of `setBalance(x)`. For pure data carriers, a `record` gives read-only accessors and no setters at all.

## No friend: package-private and nested classes

✍️ Java has no `friend` keyword. When two classes must cooperate closely, put them in the **same package** and use package-private members, or make one a **nested class** of the other (a nested class can see the enclosing class's private members).
✍️ This is deliberately coarser than C++ friendship: access is granted to a whole package or an enclosing class, not to one named function.
- Legitimate uses mirror C++: an iterator implemented as a nested class of its collection, or helper classes kept in the same package as the type they serve.

## Interview questions

✍️ **Q: Encapsulation vs abstraction?** Encapsulation protects an object's data behind its methods (how the class guards its state). Abstraction exposes only what an object does and hides how (what callers depend on).
✍️ **Q: Can private fields of one object be accessed by another object of the same class?** Yes — access control is per class, not per object.
- **Q: What is package-private used for?** Letting classes in the same module cooperate without exposing members to the whole application.
- **Q: How do you make an object immutable?** Make every field `private final`, set them only in the constructor, and provide no setters (or use a `record`).
