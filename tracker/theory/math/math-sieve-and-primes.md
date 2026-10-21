# Primes and the sieve of Eratosthenes

> Trial division up to √n for one number; the sieve marks multiples of each prime to find all primes below n in O(n log log n).

## Is n prime?

✍️ Check divisors from 2 up to √n (`i * i <= n`). If none divides n, it is prime. O(√n).

## All primes below n

```java
boolean[] isPrime = new boolean[n];
Arrays.fill(isPrime, true);
if (n > 0) isPrime[0] = false;
if (n > 1) isPrime[1] = false;
for (long i = 2; i * i < n; i++)
    if (isPrime[(int) i])
        for (long j = i * i; j < n; j += i) isPrime[(int) j] = false;   // start at i*i
```
✍️ Start crossing out at i², because smaller multiples were already crossed out by smaller primes.

## Where it appears

Count primes (LeetCode 204), prime factorisation of many numbers (store the smallest prime factor), closest prime pairs in a range.
