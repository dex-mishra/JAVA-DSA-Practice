# Rolling hash (recognition level)

> Represent a substring as a number that can be updated in O(1) when the window slides, to compare substrings in O(1) (Rabin–Karp).

## Idea

✍️ hash(s[i..i+m−1]) = s[i]·B^(m−1) + … + s[i+m−1] mod P. Sliding right: subtract the leaving character's term, multiply by B, add the new character.
✍️ Equal hashes ⇒ probably equal strings (verify if a collision would be costly). Used for "longest duplicate substring" with binary search, and Rabin–Karp matching.

## Caution

✍️ Use a large prime modulus (e.g. 10⁹+7) with `long`, or two different moduli to make collisions negligible.
