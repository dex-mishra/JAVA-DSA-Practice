# PLACEMENT ROADMAP: SDE + DATA SCIENCE
### IIT Kharagpur | Manufacturing Science & Engineering | CG 7.15 | Target 35+ LPA

---

# PART 0 — POSITIONING REALITY (read this first)

## 0.1 What your numbers actually do

**CGPA 7.15**
- Clears companies with a 7.0 cutoff (this is the most common cutoff band)
- Fails companies with a 7.5 or 8.0 cutoff — and a meaningful slice of the 35+ LPA bracket sits at 8.0
- The gap between 7.15 and 7.5 is roughly one strong semester. If Autumn 2026 grades land before your target company opens, this is the single highest ROI action available to you
- CGPA is a **shortlisting filter, not an interview topic**. Once you are in the room it stops mattering almost entirely

**Manufacturing branch**
- Some companies restrict by branch (CSE/EE/ECE only). You cannot fix this; you route around it
- Most high-paying product companies at IITs are **branch-agnostic** (open to all) — Google, Microsoft, Uber, Rubrik, Atlassian, Salesforce, Adobe, most quant firms
- Branch is not the killer people think it is. What kills non-CS candidates is **weak CS fundamentals**, not the degree name

**The honest summary**
- Your profile does not get you shortlisted on paper. It gets you shortlisted on **objective external signals** — Codeforces rating, Kaggle medals, publications, brand internships, Inter-IIT medals
- Everything in Part 3 is built around this

## 0.2 The dual-track problem

- SDE and DS overlap maybe 30% (DSA, SQL, some CS core). The other 70% is disjoint
- Running both tracks fully will cost you roughly 1.6x the effort of one track for maybe 1.2x the shortlists
- **Recommended split: 70/30.** Pick one as primary, keep the other alive at a "can clear an OA and hold a conversation" level
- If you must choose: SDE has more open slots at 35+ LPA and a cleaner objective signal (CF rating). DS at that band skews toward quant/research roles which weight CGPA and pedigree harder

## 0.3 Timeline reality

- Day 1 of IIT placements is **1 December**. From today (10 Aug 2026) that is roughly **16 weeks**
- OA/shortlist season starts in **October**. Your CV freezes around **late September**
- This means: CV-building actions (internship, publication, rating) must be **already in motion**. The next 16 weeks are primarily an **execution and prep** window, not a profile-building window
- Full week-by-week plan in Part 4

---

# PART 1 — SDE ROADMAP (exhaustive)

## 1.1 Language mastery — C++ (recommended primary)

**Core language**
- Data types, sizes, overflow, `long long`, `__int128`, unsigned arithmetic, integer promotion
- References vs pointers, pointer arithmetic, null vs dangling pointers
- Const correctness, `constexpr`, `static`, `inline`, `extern`
- Stack vs heap, `new`/`delete`, memory leaks, RAII
- Smart pointers: `unique_ptr`, `shared_ptr`, `weak_ptr`, reference cycles
- Lvalues/rvalues, move semantics, `std::move`, perfect forwarding, copy elision, RVO
- Rule of 0/3/5
- Templates, function templates, class templates, template specialisation, SFINAE (awareness level), variadic templates
- Lambdas, captures by value/reference, `mutable` lambdas, `std::function`
- Exception handling, `noexcept`, stack unwinding
- Namespaces, header guards, compilation and linking model, ODR
- Undefined behaviour: signed overflow, out-of-bounds, uninitialised reads, iterator invalidation

**STL (must be reflexive, not looked-up)**
- Containers: `vector`, `deque`, `list`, `forward_list`, `array`, `string`
- Associative: `set`, `multiset`, `map`, `multimap`, `unordered_*`, custom hash (needed against anti-hash tests on Codeforces)
- Adapters: `stack`, `queue`, `priority_queue` with custom comparators
- `bitset`, `pair`, `tuple`, `optional`, `variant`
- Iterators: categories, invalidation rules per container
- Algorithms: `sort`, `stable_sort`, `nth_element`, `partial_sort`, `lower_bound`, `upper_bound`, `binary_search`, `equal_range`, `next_permutation`, `accumulate`, `partial_sum`, `adjacent_difference`, `unique`, `rotate`, `reverse`, `min_element`, `max_element`, `count_if`, `find_if`, `all_of`/`any_of`/`none_of`, `transform`, `merge`, `set_union`/`set_intersection`/`set_difference`, `iota`, `shuffle`
- Complexity of every container operation (asked directly in interviews)
- Policy-based data structures (`__gnu_pbds` ordered_set) — CP only

**Also worth having**
- Python at a "can write it fast in an interview" level (many DS OAs and some SDE OAs are Python-friendly)
- Java only if the company mandates it (some banks do)

## 1.2 DSA — complete topic tree

### Arrays & fundamentals
- Traversal patterns, in-place modification, rotation (reversal algorithm, juggling)
- Kadane's algorithm, maximum circular subarray, maximum product subarray
- Dutch National Flag, sort colors
- Boyer-Moore majority vote, extended majority (n/3)
- Prefix sums, suffix sums, 2D prefix sums, difference arrays, 2D difference arrays
- Two pointers (same direction, opposite direction), three pointers
- Fast and slow pointers (cycle detection, middle element)
- Sliding window: fixed size, variable size, window with hashmap, window with monotonic deque, at-most-K to exactly-K trick
- Merge intervals, insert interval, interval scheduling
- Next greater/smaller element family
- Subarray sum equals K (prefix + hashmap), subarray with given XOR
- Matrix: spiral traversal, rotation, transpose, search in sorted matrix, set matrix zeroes, diagonal traversal

### Binary search
- Classic on sorted array
- Lower bound / upper bound implementation from scratch
- Binary search on rotated array (with and without duplicates)
- **Binary search on answer** (predicate/monotonic function) — this is the single most-tested variant
- Binary search on floating point (with epsilon and fixed iteration count)
- Ternary search on unimodal functions
- Median of two sorted arrays (partition method)
- Aggressive cows / allocate books / painter's partition / capacity to ship
- Parallel binary search (advanced)
- Binary lifting (as a search technique on trees)

### Sorting
- Merge sort, quick sort (partition schemes: Lomuto, Hoare), heap sort, insertion, selection, bubble
- Counting sort, radix sort, bucket sort
- Stability, in-place, comparison vs non-comparison lower bounds
- Count inversions via merge sort or BIT
- Custom comparators, sorting by multiple keys
- External sorting concept (large file sorting)

### Strings
- Palindrome checks, longest palindromic substring/subsequence
- Anagrams, character frequency
- String hashing: polynomial rolling hash, single vs double modulus, collision probability
- KMP (prefix/failure function), applications beyond matching
- Z-algorithm
- Rabin-Karp
- Manacher's algorithm
- Trie: insertion, search, prefix count, delete
- Suffix array + LCP (Kasai's)
- Suffix automaton, suffix tree (awareness)
- Aho-Corasick (multi-pattern matching)
- String compression, run-length encoding
- Word break, longest common prefix, string to integer (atoi) edge cases

### Recursion & backtracking
- Recursion tree, recurrence relations, Master theorem
- Subsets, subsets with duplicates, permutations (with and without duplicates)
- Combination sum family
- N-Queens, Sudoku solver, rat in maze, word search, knight's tour
- Generate balanced parentheses
- Palindrome partitioning
- Backtracking pruning strategies
- Converting recursion to memoisation to tabulation

### Linked lists
- Singly, doubly, circular
- Reverse (iterative, recursive, in k-groups)
- Cycle detection (Floyd), find cycle start, cycle length
- Merge two sorted, merge k sorted
- Sort a linked list (merge sort on list)
- Intersection of two lists
- Palindrome check, reorder list
- Copy list with random pointer
- Flatten a multilevel list
- LRU cache (hashmap + doubly linked list), LFU cache
- Skip list (awareness)

### Stacks & queues
- Implementation via array/list, stack via queues and vice versa
- Min stack, max stack (O(1) auxiliary)
- **Monotonic stack**: next greater element, previous smaller, largest rectangle in histogram, maximal rectangle, trapping rain water, stock span, sum of subarray minimums
- Monotonic deque: sliding window maximum
- Infix/prefix/postfix conversion and evaluation
- Valid parentheses, longest valid parentheses
- Circular queue, deque
- Priority queue internals

### Trees
- Traversals: preorder, inorder, postorder (recursive, iterative with stack, Morris O(1) space)
- Level order, zigzag, vertical order, boundary traversal
- Views: left, right, top, bottom
- Height, depth, diameter, balanced check
- LCA: naive, binary lifting, Euler tour + sparse table, Tarjan's offline
- Path sum problems, max path sum
- Serialize/deserialize
- Construct from traversals (pre+in, post+in, level+in)
- BST: search, insert, delete, validate, floor/ceil, kth smallest, inorder successor/predecessor, range queries, convert to DLL, merge two BSTs
- Self-balancing: AVL rotations, Red-Black tree properties (conceptual — asked in fundamentals rounds)
- B-tree / B+ tree structure (asked in DBMS context)
- **Tree DP**: subtree sums, longest path, independent set on tree, distance sums
- **Rerooting technique**
- Euler tour + segment tree for subtree queries
- Heavy-Light Decomposition
- Centroid decomposition
- Small-to-large merging (DSU on tree)
- Segment tree on tree paths
- Trie as a tree structure

### Heaps / priority queues
- Binary heap: heapify, insert, extract, build heap in O(n)
- Kth largest/smallest, kth largest in stream
- Merge k sorted lists/arrays
- Median in a data stream (two heaps)
- Top-K frequent elements
- Task scheduler, reorganise string
- Indexed priority queue / decrease-key
- Fibonacci heap (awareness only)

### Tries
- Standard prefix trie, count prefixes, autocomplete
- **XOR trie / binary trie**: maximum XOR pair, maximum XOR with element, count pairs with XOR in range
- Persistent trie
- Compressed trie / radix tree
- Word dictionary with wildcards

### Graphs
- Representations: adjacency matrix, adjacency list, edge list, implicit graphs
- BFS, DFS (recursive + iterative), multi-source BFS, 0-1 BFS (deque), bidirectional BFS
- Connected components, number of islands, flood fill
- Cycle detection: undirected (DFS/DSU), directed (colouring/recursion stack)
- Topological sort: Kahn's algorithm, DFS-based; lexicographically smallest topo order; DAG longest path; course schedule family
- Bipartite check / 2-colouring
- **DSU**: union by rank/size, path compression, DSU with rollback, DSU on offline queries, weighted DSU
- **SCC**: Kosaraju, Tarjan; condensation graph
- Bridges, articulation points, biconnected components
- 2-SAT via implication graph + SCC
- **MST**: Kruskal, Prim, Boruvka; second-best MST; MST with constraints
- **Shortest paths**: Dijkstra (with heap, with set), Bellman-Ford (negative cycles), Floyd-Warshall, Johnson's, SPFA, A*, Dial's algorithm
- Shortest path in DAG via topo order
- K-shortest paths
- **Max flow**: Ford-Fulkerson, Edmonds-Karp, Dinic's; min-cut max-flow theorem; applications (project selection, image segmentation)
- **Bipartite matching**: Kuhn's, Hopcroft-Karp, Hungarian algorithm (assignment problem)
- Min-cost max-flow
- Eulerian path/circuit (Hierholzer's), Hamiltonian path (bitmask DP)
- Functional graphs, cycle finding in permutation
- Grid as graph, state-space BFS (puzzle problems, word ladder)
- Tree isomorphism, graph colouring (concept), matroid intersection (advanced/rare)

### Dynamic programming
**Core patterns**
- Linear DP: Fibonacci-style, climbing stairs, house robber (I/II/III), decode ways, jump game
- LIS: O(n²), O(n log n) patience sorting, LIS variants (count, print, bitonic), Russian doll envelopes
- **Knapsack family**: 0/1, unbounded, bounded (binary splitting), fractional (greedy), subset sum, equal partition, count subsets, target sum, minimum difference partition
- Coin change (min coins, count ways), rod cutting
- **Grid DP**: unique paths, min path sum, with obstacles, maximal square, cherry pickup (multi-agent)
- **String DP**: LCS, longest common substring, edit distance, distinct subsequences, wildcard matching, regex matching, shortest common supersequence, interleaving strings, palindrome partitioning (min cuts)
- **Interval/MCM DP**: matrix chain multiplication, burst balloons, boolean parenthesisation, egg drop, stone game family
- **Partition DP**
- **Tree DP** and rerooting
- **Bitmask DP**: TSP, assignment problem, minimum set cover, counting Hamiltonian paths, broken profile DP
- **Digit DP**: count numbers with property in range
- **Probability/expectation DP**, linearity of expectation
- **SOS DP** (sum over subsets, subset convolution)
- DP on DAGs
- Game DP / minimax DP

**Optimisations (the difference between shortlisted and hired)**
- Space optimisation (rolling arrays, 1D from 2D)
- Convex Hull Trick (static, Li Chao tree, dynamic)
- Divide and Conquer optimisation
- Knuth-Yao optimisation
- Monotonic deque optimisation
- Matrix exponentiation for linear recurrences
- Aliens trick / Lagrangian relaxation
- Memoisation with maps for sparse states
- DP with segment tree / BIT
- Meet in the middle

### Greedy
- Exchange argument (proving greedy correctness — asked verbally)
- Activity selection, interval scheduling, minimum meeting rooms/platforms
- Fractional knapsack
- Huffman coding
- Job sequencing with deadlines
- Gas station circular tour
- Jump game II
- Candy distribution
- Minimum number of arrows / non-overlapping intervals
- Task scheduling with cooldown
- When greedy fails vs when DP is needed (interviewers test this boundary)

### Number theory & math
- GCD, LCM, Euclidean and extended Euclidean
- Modular arithmetic: addition/multiplication/exponentiation, modular inverse (Fermat, extended Euclid), division under mod
- Fast/binary exponentiation, modular exponentiation
- Sieve of Eratosthenes, linear sieve, segmented sieve, smallest prime factor sieve
- Prime factorisation, divisor count, divisor sum, number of divisors of factorial
- Euler's totient function and properties
- Chinese Remainder Theorem
- Mobius function and inversion
- Primality: trial division, Miller-Rabin; Pollard's rho for factorisation
- Matrix exponentiation
- FFT / NTT for polynomial multiplication
- **Combinatorics**: nCr, Pascal's triangle, nCr mod prime (factorials + inverse factorials), Lucas theorem, stars and bars, inclusion-exclusion, derangements, Catalan numbers, Stirling numbers, Burnside's lemma / Polya counting
- **Probability**: basics, conditional, expected value, linearity of expectation, indicator random variables
- **Game theory**: Nim, Sprague-Grundy theorem, mex, misère games, impartial vs partisan games, win/lose state DP
- Pigeonhole principle, invariants, monovariants
- Base conversions, logarithm tricks

### Bit manipulation
- AND/OR/XOR/NOT/shifts, precedence
- Check/set/clear/toggle i-th bit, lowest set bit (`x & -x`), clear lowest set bit (`x & (x-1)`)
- `__builtin_popcount`, `__builtin_clz`, `__builtin_ctz`
- Count set bits, check power of two, next power of two
- XOR properties: single number, two single numbers, missing number, XOR of range 1..n
- Subset enumeration via bitmask, enumerating submasks in O(3^n)
- **XOR basis / linear basis** over GF(2)
- Gray code
- `bitset` for O(n/64) speedups
- Bitmask as DP state

### Range query data structures
- Prefix sums (immutable range sum)
- **Sparse table** (idempotent operations: min, max, gcd) — O(1) query
- **Fenwick / BIT**: point update range query, range update point query, range update range query, 2D BIT, BIT for counting inversions, BIT with coordinate compression
- **Segment tree**: build/query/update, lazy propagation, range assign, merge sort tree, persistent segment tree, dynamic/implicit segment tree, iterative segment tree, segment tree beats (advanced)
- Sqrt decomposition
- **Mo's algorithm**: basic, with updates, on trees, Hilbert curve ordering
- Offline query processing, coordinate compression
- Wavelet tree (rare)
- Treap / balanced BST for order statistics

### Geometry
- Points, vectors, dot product, cross product
- Orientation test, collinearity
- Line-line intersection, segment intersection
- Distance point-to-line, point-to-segment
- Polygon area (shoelace), point in polygon (ray casting, winding)
- **Convex hull**: Graham scan, Andrew's monotone chain
- Closest pair of points (divide and conquer)
- Rotating calipers, diameter of point set
- Line sweep, area of union of rectangles
- Circle problems, circle-line intersection
- Floating point precision and epsilon comparison

### Miscellaneous techniques
- Meet in the middle
- Randomised algorithms, random shuffle, reservoir sampling
- Amortised analysis, potential method
- Complexity classes: P, NP, NP-complete, NP-hard (conceptual, asked in fundamentals)
- Space-time tradeoffs
- Offline vs online algorithms
- Bit-parallel tricks

## 1.3 CS core fundamentals — **your highest-leverage gap as a Manufacturing student**

Non-CS candidates lose interviews here far more often than in DSA. Companies assume CSE students know this and probe non-CS students harder to check.

### Operating Systems
- Process vs thread vs program, PCB, process states and transitions
- Context switching, cost of context switch
- **Scheduling**: FCFS, SJF, SRTF, priority (with ageing), Round Robin, multilevel queue, multilevel feedback queue, CFS; preemptive vs non-preemptive; turnaround/waiting/response time calculations (numericals appear in OAs)
- **Concurrency**: race conditions, critical section problem, Peterson's solution, hardware support (test-and-set, compare-and-swap)
- Synchronisation primitives: mutex, binary vs counting semaphore, monitors, condition variables, spinlock, barrier, read-write lock
- Classic problems: producer-consumer (bounded buffer), readers-writers, dining philosophers, sleeping barber, cigarette smokers
- **Deadlock**: four Coffman conditions, prevention, avoidance (Banker's algorithm — solve numericals), detection, recovery; livelock, starvation, priority inversion (and priority inheritance)
- **Memory management**: contiguous allocation, first/best/worst fit, internal vs external fragmentation, compaction
- **Paging**: page table, multi-level page tables, inverted page table, TLB, effective access time calculation
- Segmentation, segmented paging
- **Virtual memory**: demand paging, page fault handling, page replacement (FIFO, LRU, LFU, Optimal, Clock/Second-chance, NRU), Belady's anomaly, thrashing, working set model, page fault frequency
- Memory-mapped files, copy-on-write
- **File systems**: file allocation (contiguous, linked, indexed), inodes, directory structures, FAT, ext family, journaling, hard links vs soft links
- **Disk scheduling**: FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK (numericals)
- RAID levels 0/1/5/6/10
- **IPC**: pipes, named pipes/FIFOs, shared memory, message queues, sockets, signals
- System calls, user mode vs kernel mode, interrupts vs traps vs exceptions
- Threading: user vs kernel threads, many-to-one/one-to-one/many-to-many models, thread pools, green threads, coroutines
- Linux specifics: `fork`, `exec`, `wait`, zombie and orphan processes, process tree, `/proc`, signals, daemon processes
- Booting sequence, kernel types (monolithic, microkernel, hybrid)

### DBMS
- ER model, entities, attributes, relationships, cardinality, weak entities, generalisation/specialisation; ER to relational mapping
- Relational model, keys: super, candidate, primary, alternate, foreign, composite, surrogate
- Relational algebra (selection, projection, join, division, set ops), tuple and domain relational calculus
- **Normalisation**: functional dependencies, attribute closure, canonical/minimal cover, 1NF, 2NF, 3NF, BCNF, 4NF (multivalued dependencies), 5NF; lossless join decomposition, dependency preservation; denormalisation and when it is correct
- **SQL depth**: DDL/DML/DCL/TCL; all join types including self-join and anti-join; subqueries and correlated subqueries; EXISTS vs IN vs JOIN; CTEs and recursive CTEs; **window functions** (ROW_NUMBER, RANK, DENSE_RANK, NTILE, LAG, LEAD, FIRST_VALUE, running totals, moving averages, PARTITION BY, frame clauses); GROUP BY, HAVING, GROUPING SETS, ROLLUP, CUBE; aggregate functions; set operations; CASE expressions; NULL semantics and three-valued logic; views and materialised views; stored procedures, functions, triggers, cursors
- **Indexing**: B-tree and B+ tree structure and why B+ for DBs; hash index; clustered vs non-clustered; covering index; composite index and left-prefix rule; index selectivity and cardinality; when an index makes things slower; bitmap index
- Query processing and optimisation, cost estimation, EXPLAIN/query plans, join algorithms (nested loop, block nested loop, sort-merge, hash join)
- **Transactions**: ACID properties, transaction states, schedules, serialisability (conflict and view), precedence graph, recoverable and cascadeless schedules
- **Concurrency control**: lock-based (shared/exclusive/intent locks, lock compatibility matrix), 2PL, strict 2PL, rigorous 2PL, timestamp ordering, Thomas write rule, validation/optimistic CC, **MVCC**, deadlock in databases (wait-die, wound-wait, wait-for graph)
- **Isolation levels**: read uncommitted, read committed, repeatable read, serializable; dirty read, non-repeatable read, phantom read — know which anomaly each level permits
- **Recovery**: log-based recovery, write-ahead logging, undo/redo, checkpoints, ARIES, shadow paging
- **NoSQL**: key-value, document, wide-column, graph databases; when each is appropriate; **CAP theorem**, PACELC, BASE, eventual consistency
- Sharding, horizontal vs vertical partitioning, replication strategies
- OLTP vs OLAP, data warehouse, star and snowflake schema, fact and dimension tables, slowly changing dimensions

### Computer Networks
- OSI 7-layer and TCP/IP models, encapsulation and decapsulation, PDU names per layer
- Physical layer: transmission media, bandwidth vs throughput, multiplexing (FDM, TDM, WDM), Nyquist and Shannon limits
- **Data link**: framing, error detection (parity, checksum, **CRC** — be able to compute), error correction (Hamming code), flow control (stop-and-wait, sliding window, **Go-Back-N**, **Selective Repeat** — efficiency calculations), MAC protocols (ALOHA, slotted ALOHA, CSMA, CSMA/CD, CSMA/CA), Ethernet frame format, switches vs hubs vs bridges, ARP and RARP, MAC addressing, VLANs, spanning tree protocol
- **Network layer**: IPv4 header, IPv6, classful and classless addressing, **subnetting and CIDR** (practise calculations — these appear in OAs), supernetting, NAT/PAT, DHCP, ICMP, IGMP, fragmentation and MTU, TTL
- Routing: distance vector (Bellman-Ford, count-to-infinity, split horizon, poison reverse), link state (Dijkstra/OSPF), path vector (BGP), RIP, hierarchical routing, multicast
- **Transport layer**: TCP vs UDP tradeoffs, TCP header fields, **three-way handshake**, four-way termination, TCP state machine, sequence and acknowledgement numbers, sliding window, flow control (receiver window, zero window, silly window syndrome, Nagle's algorithm), **congestion control** (slow start, congestion avoidance, fast retransmit, fast recovery, Tahoe vs Reno vs New Reno vs CUBIC vs BBR), AIMD, TIME_WAIT state and why it exists, port numbers and well-known ports, socket programming (bind, listen, accept, connect, send, recv)
- **Application layer**: HTTP/1.0 vs 1.1 vs 2 vs 3 (QUIC), HTTP methods, status codes, headers, cookies, sessions, caching headers; HTTPS and the **TLS handshake**, certificates and PKI, symmetric vs asymmetric key exchange; **DNS** (hierarchy, recursive vs iterative resolution, record types A/AAAA/CNAME/MX/TXT/NS/SOA, caching, TTL, DNS over HTTPS); SMTP/IMAP/POP3; FTP (active vs passive); SSH; WebSockets vs long polling vs SSE; REST vs gRPC vs GraphQL
- Security: symmetric (AES, DES) vs asymmetric (RSA, ECC), Diffie-Hellman key exchange, hashing (MD5, SHA family), digital signatures, HMAC, firewalls, proxies, VPN, IDS/IPS; attacks — DDoS, MITM, ARP spoofing, DNS poisoning, SQL injection, XSS, CSRF, session hijacking, replay attacks
- **The classic**: "What happens when you type google.com and press enter" — prepare a 5-minute layered answer covering DNS, TCP, TLS, HTTP, rendering
- Tools: ping, traceroute, netstat, nslookup, dig, curl, tcpdump, Wireshark

### OOP & design principles
- Class, object, instance; encapsulation, abstraction, inheritance, polymorphism
- Inheritance types: single, multiple, multilevel, hierarchical, hybrid
- Polymorphism: compile-time (overloading, templates) vs runtime (overriding, virtual functions)
- Access specifiers and inheritance access rules
- Constructors: default, parameterised, copy, move, delegating; initialisation lists; order of construction/destruction
- Destructors and **virtual destructors** (why needed)
- Abstract classes vs interfaces, pure virtual functions
- **vtable and vptr** mechanics
- Static members and static methods
- Friend functions and classes
- Operator overloading, rules and pitfalls
- **Diamond problem** and virtual inheritance
- Shallow vs deep copy
- Object slicing
- `this` pointer, `const` member functions
- Composition vs inheritance ("prefer composition"), aggregation vs association
- Coupling and cohesion, DRY, KISS, YAGNI, Law of Demeter, separation of concerns
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion — be able to give a code example of a violation and its fix for each

### Computer architecture (lighter weight but does appear)
- Von Neumann vs Harvard architecture
- Instruction cycle, ISA basics, RISC vs CISC
- **Pipelining**: stages, speedup, hazards (structural, data, control), forwarding, stalls, branch prediction, out-of-order execution, superscalar
- **Cache**: memory hierarchy, cache lines, hit/miss, mapping (direct, fully associative, set associative), replacement policies, write-through vs write-back, write-allocate, cache coherence (MESI protocol), **false sharing**, spatial and temporal locality, cache-friendly code
- Virtual vs physical addressing, MMU
- Endianness, word alignment, padding in structs
- DMA, interrupts
- Amdahl's law, Little's law

## 1.4 Low-Level Design (LLD)

### Foundations
- Requirement gathering and clarification, functional vs non-functional requirements
- Identifying entities, responsibilities, relationships
- Class diagrams, sequence diagrams, state diagrams (basic UML)
- Interface-first thinking, programming to abstractions
- SOLID applied in practice
- Extensibility: designing for the requirement they will add in the follow-up question

### Design patterns (know intent, structure, a real example, and the tradeoff for each)
**Creational**
- Singleton (thread-safe, double-checked locking, eager vs lazy, why it is often an anti-pattern)
- Factory Method, Abstract Factory
- Builder (and fluent interfaces)
- Prototype
- Object Pool

**Structural**
- Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy

**Behavioural**
- Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor, Null Object

**Concurrency**
- Producer-Consumer, Thread Pool, Read-Write Lock, Monitor Object, Active Object, Future/Promise, Double-Checked Locking

**Architectural**
- MVC, MVP, MVVM, Repository, DAO, DTO, Service layer, Dependency Injection, Inversion of Control, Service Locator, Event Sourcing, CQRS

### Concurrency in LLD
- Thread safety, immutability, atomicity
- Locks, lock granularity, lock ordering to avoid deadlock
- Concurrent collections, lock-free structures (awareness), CAS
- Designing a thread-safe cache, thread-safe singleton, connection pool

### Classic LLD problem set (practise writing actual classes, not diagrams)
- Parking lot
- Elevator/lift system (multi-lift scheduling)
- ATM
- Vending machine
- Library management system
- Hotel booking system
- Movie ticket booking (BookMyShow) — concurrency on seat locking is the real test
- Splitwise
- Snake and Ladder, Chess, Tic-tac-toe
- Deck of cards / card game
- **LRU cache, LFU cache**
- **Rate limiter**
- Logging framework
- Notification service (multi-channel)
- Food delivery (Swiggy/Zomato)
- Ride sharing (Uber) — matching and pricing
- E-commerce cart and order system
- Inventory management
- In-memory file system
- Task management board (Trello/Jira)
- Calendar and meeting scheduler (conflict detection)
- URL shortener (class-level)
- Auction/bidding system
- Online judge
- Chat application
- Traffic signal controller
- Car rental, airline reservation
- Text editor with undo/redo
- Spreadsheet with formula dependency

## 1.5 High-Level Design / System Design

### Building blocks
- Vertical vs horizontal scaling, stateless service design
- **Load balancing**: L4 vs L7, algorithms (round robin, weighted RR, least connections, least response time, IP hash, **consistent hashing** with virtual nodes), health checks, sticky sessions, global server load balancing
- **Caching**: layers (browser, CDN, reverse proxy, application, database); strategies (cache-aside, read-through, write-through, write-behind, write-around, refresh-ahead); eviction (LRU, LFU, FIFO, TTL, random); invalidation strategies; **cache stampede/thundering herd** and mitigations (locking, probabilistic early expiry, request coalescing); hot key problem; Redis vs Memcached; Redis data structures and persistence (RDB, AOF)
- **CDN**: push vs pull, edge caching, cache headers, geo-distribution
- **Databases at scale**: SQL vs NoSQL decision framework; indexing strategy; **sharding** (range, hash, geo, directory-based), resharding, hotspots; **replication** (single-leader, multi-leader, leaderless; synchronous vs asynchronous; replication lag; read-your-writes); read replicas; connection pooling; federation
- **Consistency**: strong, eventual, causal, read-your-writes, monotonic reads, monotonic writes; **CAP theorem** and its common misinterpretation; **PACELC**; quorum reads/writes (R + W > N); vector clocks; conflict resolution (LWW, CRDTs); linearisability vs serialisability
- **Messaging**: message queues vs pub-sub; **Kafka** (topics, partitions, offsets, consumer groups, replication, retention, ordering guarantees), RabbitMQ, SQS/SNS; delivery semantics (at-most-once, at-least-once, exactly-once); **idempotency**; dead letter queues; backpressure; event-driven architecture; log compaction
- **Communication**: REST, GraphQL, gRPC (protobuf, streaming), WebSockets, Server-Sent Events, long polling, webhooks; synchronous vs asynchronous
- **API design**: resource modelling, versioning strategies, **pagination** (offset vs cursor/keyset), filtering and sorting, idempotency keys, **rate limiting** (token bucket, leaky bucket, fixed window counter, sliding window log, sliding window counter — know the tradeoffs), authentication (session cookies, JWT, OAuth 2.0 flows, OIDC, API keys), authorisation (RBAC, ABAC)
- **Storage**: object/blob storage (S3), block vs file vs object; time-series databases; **search** (inverted index, Elasticsearch, tokenisation, relevance scoring/TF-IDF/BM25); columnar storage
- **Distributed systems**: consensus (Raft, Paxos at concept level), leader election, distributed locks (Redlock and its criticisms, ZooKeeper), **distributed transactions** (2PC, 3PC, **Saga** pattern with orchestration vs choreography), service discovery, **circuit breaker**, bulkhead, retries with exponential backoff and **jitter**, timeouts and deadlines, graceful degradation, chaos engineering
- Microservices vs monolith tradeoffs, API gateway, BFF pattern, service mesh, sidecar
- Containers and orchestration: Docker, Kubernetes (pods, services, deployments, autoscaling)
- **Observability**: structured logging, metrics (RED and USE methods), distributed tracing, alerting, SLI/SLO/SLA, error budgets
- **Estimation**: QPS calculation, storage sizing, bandwidth, server count, memory for cache; latency numbers every programmer should know (L1 cache, main memory, SSD, disk, network round trip within and across datacentres)
- Security at scale: encryption at rest and in transit, secrets management, PII handling, DDoS mitigation, WAF

### Classic HLD problem set
- URL shortener (TinyURL)
- Pastebin
- Twitter/X news feed (fanout on write vs read, celebrity problem)
- Instagram
- WhatsApp / real-time messenger (delivery receipts, online status, group messaging)
- Uber / ride matching (geospatial indexing, quadtree, geohash, S2)
- YouTube / Netflix (video upload pipeline, transcoding, adaptive bitrate streaming, CDN)
- Dropbox / Google Drive (chunking, deduplication, sync, conflict resolution)
- Web crawler (politeness, dedup, URL frontier, distributed crawling)
- Search autocomplete / typeahead (trie at scale, ranking)
- Rate limiter (distributed)
- Notification system (multi-channel, retries, deduplication)
- Ticket booking system (seat locking, concurrency, overbooking)
- Payment system (idempotency, reconciliation, double-entry ledger)
- Distributed cache
- Distributed unique ID generator (UUID, Snowflake, ticket server)
- Leaderboard / ranking system
- Ad click aggregator / real-time analytics
- Log collection and analytics pipeline
- Proximity service (Yelp, nearby restaurants)
- Stock exchange / order matching engine
- Google Docs (operational transformation vs CRDTs)
- Recommendation system
- Distributed job scheduler / cron
- Key-value store (Dynamo-style)
- API rate-limited gateway

## 1.6 Development and practical skills

- **Git**: branching, merge vs rebase, cherry-pick, stash, reflog, bisect, resolving conflicts, PR workflow, conventional commits, git internals (objects, refs, HEAD)
- **Linux/shell**: file navigation, permissions, process management (`ps`, `top`, `kill`), pipes and redirection, `grep`/`sed`/`awk`, `find`, `xargs`, `tar`, `ssh`, `scp`, cron, environment variables, shell scripting basics
- **Docker**: images vs containers, Dockerfile, layers, volumes, networking, docker-compose, multi-stage builds
- **CI/CD**: GitHub Actions basics, build/test/deploy pipeline concepts
- **Testing**: unit vs integration vs e2e, mocking, test doubles, TDD, code coverage, property-based testing, writing testable code
- **Debugging**: gdb basics, print debugging discipline, profilers, memory tools (valgrind, sanitizers)
- **One backend framework in depth**: Node/Express, FastAPI, Spring Boot, or Go/Gin — depth in one beats surface in four
- **One frontend framework** if you claim full-stack: React/Next.js, state management, rendering models (CSR/SSR/SSG/ISR), hydration
- Basic cloud: one of AWS/GCP/Azure — EC2/compute, S3/storage, RDS, Lambda/functions, IAM concepts
- Code quality: readability, naming, error handling, logging, code review etiquette

## 1.7 Competitive programming track (your primary CG-compensator)

**Why**: Codeforces rating is the only line on a non-CS CV that a recruiter can verify in 10 seconds and that no CGPA filter can override.

**Rating milestones and what they mean**
| Rating | Title | What it signals |
|---|---|---|
| < 1200 | Newbie | Not a differentiator; do not list |
| 1200–1399 | Pupil | Weak signal; list only if nothing else |
| 1400–1599 | Specialist | Baseline credibility |
| **1600–1899** | **Expert** | **Minimum to be treated seriously for 35+ LPA SDE** |
| **1900–2099** | **Candidate Master** | **Genuine differentiator; overrides most CGPA concerns** |
| 2100+ | Master | Recruiters seek you out; CGPA becomes near-irrelevant |

**Parallel signals**
- CodeChef 5-star (2000+) / 6-star (2200+)
- LeetCode Knight (1850+) / Guardian (2200+) — weaker signal than CF but easy to add
- AtCoder rating (green/cyan and above)
- **ICPC**: Regionals qualification is strong; top-100 at Regionals is very strong. Preliminaries are usually in Oct–Nov

**How to actually climb**
- Contest cadence: 2–3 rated contests per week, non-negotiable
- Upsolve everything: after each contest solve every problem you did not solve during the contest, including reading editorials for the ones above your level
- Maintain a wrong-answer log: problem, why you failed (concept gap, implementation bug, misread statement, TLE)
- Practise at rating +200 to +300 above current level
- Volume: Codeforces problemset filtered by tag and rating; CSES problem set (complete it — it is the best structured 300-problem list); AtCoder DP contest; USACO Guide for structured progression
- Speed matters: rating is partly a typing and template speed function. Build a template, learn to implement common structures in under 3 minutes

## 1.8 OA anatomy (what actually appears)

**Type A — Pure DSA (most product companies)**
- 2–4 problems, 60–120 minutes
- Difficulty: typically Codeforces 1200–1900 equivalent, occasionally 2000+
- Hidden test cases, partial scoring sometimes
- Common platforms: HackerRank, HackerEarth, Codesignal, own portal

**Type B — DSA + CS fundamentals MCQs**
- Coding section plus 20–40 MCQs on OS, DBMS, CN, OOP, aptitude
- **This is where non-CS candidates get eliminated silently** — you clear the code, fail the MCQs
- Includes output-prediction questions (C/C++ pointer arithmetic, static variables, operator precedence, undefined behaviour)

**Type C — Aptitude-heavy (banks, some consulting-tech)**
- Quantitative aptitude, logical reasoning, verbal, data interpretation
- Time-speed-distance, permutations, probability, series, syllogisms, puzzles

**Type D — Debugging / code completion**
- Given broken code, fix it. Tests reading comprehension of unfamiliar code

**Type E — CS-fundamentals-only screening**
- Some companies filter entirely on OS/DBMS/CN before any coding round

**Type F — Take-home / project-based** (startups)
- Build a small service in 24–48 hours, evaluated on design and code quality

## 1.9 Interview round anatomy

- **Round 1 — DSA screen**: 1–2 medium/hard problems, 45–60 min, write compilable code, discuss complexity, handle follow-ups
- **Round 2 — DSA + CS fundamentals**: harder problem plus OS/DBMS/CN probing
- **Round 3 — LLD**: design a system's classes, live coding of core classes, extend to a new requirement
- **Round 4 — HLD**: for SDE-1 this is often lighter but increasingly present at 35+ LPA
- **Round 5 — Project deep dive**: they pick the most impressive line on your CV and dig until you break. Every claim must survive 20 minutes of questioning
- **Round 6 — Hiring manager / behavioural**: conflict, failure, ownership, why this company, why not core branch
- **Round 7 — HR**: expectations, location, joining

**Non-negotiable interview habits**
- Clarify before coding (input constraints, edge cases, expected scale)
- Think out loud; silence reads as being stuck
- State brute force, then optimise, and say why
- Write clean code with meaningful names in an interview even if your CP style is terse
- Dry-run on an example before saying "done"
- State time and space complexity unprompted
- When stuck, say what you are considering and why it does not work

---

# PART 2 — DATA SCIENCE ROADMAP (exhaustive)

## 2.1 Mathematics

### Linear algebra
- Vectors, vector spaces, span, basis, linear independence, dimension, rank, nullity, rank-nullity theorem
- Matrix operations, transpose, inverse, pseudo-inverse, determinant, trace
- Systems of linear equations, Gaussian elimination
- Orthogonality, orthonormal bases, Gram-Schmidt, projections, least squares as projection
- Norms: L0, L1, L2, L-infinity, Frobenius; why L1 induces sparsity
- **Eigenvalues and eigenvectors**, eigendecomposition, diagonalisation, spectral theorem
- **SVD**: definition, geometric meaning, relationship to PCA, low-rank approximation, truncated SVD
- Positive definite and semi-definite matrices, quadratic forms
- Decompositions: LU, QR, Cholesky
- Matrix calculus: gradient of scalar w.r.t. vector/matrix, common derivative identities

### Calculus and optimisation
- Derivatives, partial derivatives, chain rule, total derivative
- Gradient, directional derivative, Jacobian, Hessian
- Taylor expansion (first and second order)
- Convex sets, convex functions, why convexity matters for optimisation
- Unconstrained optimisation: first and second order conditions, saddle points
- **Constrained optimisation**: Lagrange multipliers, KKT conditions, duality (primal/dual), strong vs weak duality
- Gradient descent, stochastic gradient descent, mini-batch, momentum, convergence behaviour, learning rate effects
- Newton's method, quasi-Newton (BFGS, L-BFGS), coordinate descent
- Line search, trust region (awareness)

### Probability
- Sample space, events, axioms, conditional probability, law of total probability, **Bayes' theorem**
- Independence, conditional independence
- Random variables (discrete, continuous), PMF, PDF, CDF, quantile function
- Expectation, variance, covariance, correlation, higher moments, skewness, kurtosis
- Moment generating functions, characteristic functions
- **Distributions**: Bernoulli, Binomial, Multinomial, Geometric, Negative Binomial, Hypergeometric, Poisson, Uniform, **Normal/Gaussian**, Exponential, Gamma, Beta, Chi-square, Student's t, F, Log-normal, Weibull, Dirichlet; know mean, variance, when each arises, and relationships between them
- Joint, marginal, conditional distributions; multivariate normal
- Transformations of random variables, Jacobian method
- Order statistics
- **Law of Large Numbers**, **Central Limit Theorem** (statement, conditions, why it matters)
- Inequalities: Markov, Chebyshev, Jensen, Hoeffding, Cauchy-Schwarz
- Concentration and tail bounds (awareness)
- Stochastic processes basics: Markov chains, transition matrices, stationary distribution, random walks, Poisson process

### Statistics
- Descriptive statistics, measures of centre and spread, robust statistics
- Sampling: simple random, stratified, cluster, systematic; sampling bias, selection bias, survivorship bias, Simpson's paradox
- Sampling distributions, standard error
- Estimation: point estimation, bias, consistency, efficiency, sufficiency, Cramer-Rao bound
- **MLE** (derive it for common distributions), **MAP**, method of moments
- Confidence intervals (interpretation — commonly misstated in interviews)
- **Hypothesis testing**: null and alternative, test statistic, **p-value (know the precise definition)**, significance level, **Type I and Type II errors**, power, effect size
- Tests: one-sample and two-sample z-test, t-test (independent, paired, Welch's), chi-square (goodness of fit, independence), ANOVA (one-way, two-way), F-test, Mann-Whitney U, Wilcoxon signed-rank, Kolmogorov-Smirnov, Shapiro-Wilk, Levene's
- **Multiple testing**: family-wise error rate, Bonferroni, Holm, **Benjamini-Hochberg FDR**
- Resampling: bootstrap (percentile, BCa), jackknife, permutation tests
- Bayesian statistics: priors, likelihood, posterior, conjugate priors, credible intervals vs confidence intervals, Bayes factors, MCMC (Metropolis-Hastings, Gibbs) at concept level
- Regression diagnostics: residual analysis, heteroskedasticity, multicollinearity (VIF), autocorrelation (Durbin-Watson), influential points (Cook's distance), Q-Q plots
- Gauss-Markov theorem, BLUE, OLS assumptions (all five, and what breaks when each fails)

## 2.2 Programming and SQL

### Python
- Core data structures and their complexities, mutability, shallow vs deep copy
- Comprehensions, generators and `yield`, iterators, `itertools`
- Decorators, closures, `functools` (`lru_cache`, `partial`, `reduce`)
- Context managers, `with`, custom context managers
- OOP in Python: classes, dunder methods, properties, class vs static methods, MRO, dataclasses
- Exception handling, custom exceptions
- `collections` (Counter, defaultdict, deque, namedtuple, OrderedDict)
- Typing and type hints, `pydantic`
- GIL, multiprocessing vs threading vs asyncio
- Memory management, garbage collection, reference counting
- Virtual environments, `pip`, `poetry`, packaging, project structure

### NumPy
- ndarray, dtypes, shape, reshape, broadcasting rules, views vs copies
- Fancy indexing, boolean masking, `where`, `argsort`, `argmax`
- Vectorisation and why loops are slow
- `linalg` module, random module, seeding
- Memory layout (C vs Fortran order), strides

### Pandas
- Series and DataFrame, index semantics, MultiIndex
- `loc` vs `iloc` vs `at` vs `iat`
- `groupby` (split-apply-combine), aggregation, transformation, filtration, `agg` with multiple functions
- Merging: `merge`, `join`, `concat`; all join types; validation and indicator
- Reshaping: `pivot`, `pivot_table`, `melt`, `stack`, `unstack`, `explode`
- `apply` vs `map` vs `applymap` vs vectorised operations (and why apply is usually wrong)
- Missing data: detection, `fillna`, `dropna`, interpolation
- Datetime handling, resampling, rolling and expanding windows, time zone handling
- Categorical dtype, memory optimisation, chunked reading
- Method chaining, `pipe`, `query`, `assign`
- Common performance traps (SettingWithCopyWarning, chained indexing)

### SQL — treat this as a first-class skill, not a supporting one
- Everything in the DBMS section of Part 1
- **Window functions in depth** — the most common differentiator in DS SQL rounds
- Self-joins and anti-joins
- Ranking, top-N per group, deduplication with ROW_NUMBER
- **Cohort analysis, retention curves, funnel analysis** written in pure SQL
- Sessionisation (gaps and islands problems)
- Date and interval arithmetic, generating date series
- Running totals, moving averages, period-over-period comparison, YoY/MoM
- Pivoting without a PIVOT clause
- Handling NULLs correctly in aggregates and joins
- Query optimisation, reading execution plans
- Practise source: StrataScratch, DataLemur, LeetCode Database, HackerRank SQL

### Visualisation
- Matplotlib (figure/axes model, subplots, customisation)
- Seaborn (distribution, relational, categorical plots)
- Plotly for interactivity
- Choosing the right chart, avoiding misleading axes, colour accessibility
- Dashboarding: Streamlit, Dash, or Tableau/Power BI at a basic level

## 2.3 Classical machine learning

### Framework
- Supervised vs unsupervised vs semi-supervised vs self-supervised vs reinforcement
- Parametric vs non-parametric, discriminative vs generative
- Training/validation/test split, why a validation set exists
- **Bias-variance tradeoff** (be able to derive the decomposition)
- Overfitting and underfitting, learning curves, validation curves
- No Free Lunch theorem, curse of dimensionality, Occam's razor

### Regression
- Linear regression: OLS derivation (both normal equation and gradient descent), assumptions, interpretation of coefficients, R² and adjusted R²
- Polynomial regression
- **Ridge (L2)**: closed form, geometric intuition, effect on coefficients
- **Lasso (L1)**: sparsity, why it zeroes coefficients, coordinate descent
- Elastic Net
- Quantile regression, robust regression (Huber), RANSAC
- Generalised linear models, link functions, Poisson regression
- Isotonic regression

### Classification
- **Logistic regression**: sigmoid, log-odds, maximum likelihood derivation, log loss, decision boundary, multiclass (one-vs-rest, softmax/multinomial), regularised variants, interpretation of coefficients as odds ratios
- **Naive Bayes**: Gaussian, Multinomial, Bernoulli; the independence assumption and why it still works; Laplace smoothing
- **KNN**: distance metrics (Euclidean, Manhattan, Minkowski, cosine, Hamming, Mahalanobis), choosing k, curse of dimensionality, KD-trees and ball trees
- **SVM**: maximum margin, hard vs soft margin, hinge loss, C parameter, **kernel trick**, kernels (linear, polynomial, RBF, sigmoid), gamma, dual formulation, support vectors, SVR
- LDA and QDA
- Perceptron

### Trees and ensembles
- **Decision trees**: splitting criteria (Gini impurity, entropy, information gain, gain ratio, variance reduction), CART vs ID3 vs C4.5, pruning (pre and post, cost-complexity), handling categorical and missing values, why trees overfit
- **Bagging** and bootstrap, out-of-bag error
- **Random Forest**: feature subsampling, why decorrelation helps, feature importance (Gini importance vs permutation importance and why the former is biased), extremely randomised trees
- **Boosting**: AdaBoost (weight updates, exponential loss), **Gradient Boosting** (functional gradient descent, additive modelling, shrinkage, subsampling)
- **XGBoost**: second-order Taylor approximation, regularised objective, tree pruning by gain, sparsity-aware split finding, weighted quantile sketch, column subsampling, key hyperparameters
- **LightGBM**: leaf-wise (best-first) growth, GOSS, EFB, histogram-based splits, why it is faster, when it overfits
- **CatBoost**: ordered boosting, target statistics for categoricals, why it handles high-cardinality categoricals well
- Stacking, blending, voting ensembles
- When boosting beats bagging and vice versa

### Unsupervised learning
- **K-means**: Lloyd's algorithm, objective function, k-means++, choosing k (elbow, silhouette, gap statistic), limitations (spherical assumption, sensitivity to scale and outliers), mini-batch k-means, k-medoids
- **Hierarchical clustering**: agglomerative vs divisive, linkage criteria (single, complete, average, Ward), dendrograms
- **DBSCAN**: eps and minPts, core/border/noise points, strengths over k-means, HDBSCAN, OPTICS
- **Gaussian Mixture Models** and the **EM algorithm** (E-step, M-step, derivation, convergence, relationship to k-means)
- Spectral clustering, mean shift, affinity propagation
- Clustering evaluation: silhouette score, Davies-Bouldin, Calinski-Harabasz, adjusted Rand index, normalised mutual information, inertia
- **Dimensionality reduction**: PCA (derivation via variance maximisation and via reconstruction error, explained variance ratio, scaling requirement, relationship to SVD), kernel PCA, incremental PCA, **t-SNE** (perplexity, why distances are not preserved globally, non-determinism), **UMAP**, ICA, factor analysis, MDS, autoencoders, random projection (Johnson-Lindenstrauss)
- Matrix factorisation: NMF, SVD

### Anomaly detection
- Statistical methods (z-score, IQR, Mahalanobis distance)
- Isolation Forest, One-Class SVM, Local Outlier Factor, Elliptic Envelope
- Autoencoder reconstruction error
- Evaluation under extreme imbalance

### Recommender systems
- Content-based filtering
- Collaborative filtering (user-based, item-based), similarity measures
- **Matrix factorisation**: SVD, funk SVD, ALS, implicit feedback (BPR, WARP)
- Factorisation machines
- Hybrid systems, two-tower neural retrieval
- Cold start problem, popularity bias, diversity and serendipity
- Evaluation: precision@k, recall@k, MAP, **NDCG**, MRR, hit rate, coverage
- Candidate generation vs ranking architecture

### Time series
- Components: trend, seasonality, cyclicality, noise; additive vs multiplicative decomposition (STL)
- **Stationarity**, why it matters, ADF test, KPSS test, differencing, transformations
- ACF and PACF, and how to read them to select model orders
- AR, MA, ARMA, **ARIMA**, SARIMA, SARIMAX
- Exponential smoothing: simple, Holt's linear, Holt-Winters
- Prophet, and its assumptions
- VAR, Granger causality, cointegration
- GARCH and volatility modelling
- ML approaches: lag features, rolling statistics, Fourier terms for seasonality, gradient boosting on tabular time series
- Deep learning: LSTM, temporal CNN, Temporal Fusion Transformer, N-BEATS
- **Validation**: walk-forward validation, time-series cross-validation, why random k-fold is invalid here
- Metrics: MAE, RMSE, MAPE, sMAPE, MASE
- Multi-horizon forecasting, hierarchical forecasting, reconciliation

### Causal inference (increasingly asked, especially product DS)
- Correlation vs causation, confounding, colliders, mediators
- Potential outcomes framework, counterfactuals, ATE/ATT/CATE
- **Randomised controlled trials** as the gold standard
- **Difference-in-differences**, parallel trends assumption
- **Propensity score matching**, inverse probability weighting
- **Instrumental variables**
- **Regression discontinuity**
- Synthetic control
- Uplift modelling / heterogeneous treatment effects (T-learner, S-learner, X-learner, causal forests)
- DAGs and backdoor criterion

### Survival analysis
- Censoring types, survival and hazard functions
- Kaplan-Meier estimator, log-rank test
- Cox proportional hazards, proportional hazards assumption
- Application to churn modelling

## 2.4 Model evaluation and engineering

- **Cross-validation**: hold-out, k-fold, stratified k-fold, leave-one-out, leave-p-out, group k-fold, time-series split, nested CV, repeated CV
- **Data leakage**: target leakage, train-test contamination, temporal leakage, group leakage, leakage through preprocessing (the classic: scaling before splitting)
- **Classification metrics**: confusion matrix, accuracy, precision, recall/sensitivity, specificity, F1, F-beta, balanced accuracy, MCC, Cohen's kappa, **ROC curve and AUC**, **precision-recall curve and PR-AUC** (and when PR-AUC is the right choice), log loss, Brier score, lift and gain charts
- **Regression metrics**: MSE, RMSE, MAE, MAPE, sMAPE, R², adjusted R², Huber loss, explained variance
- Threshold selection, cost-sensitive thresholds, Youden's J
- **Calibration**: reliability diagrams, Platt scaling, isotonic regression, expected calibration error, why AUC does not imply calibration
- **Class imbalance**: class weights, random oversampling and undersampling, **SMOTE**, Borderline-SMOTE, ADASYN, Tomek links, NearMiss, ensemble methods (BalancedRandomForest, EasyEnsemble), focal loss, threshold moving, choosing the right metric
- **Feature engineering**: scaling (standard, min-max, robust, max-abs, quantile), encoding (one-hot, ordinal, label, **target/mean encoding with out-of-fold to avoid leakage**, frequency, count, hashing, embeddings, WoE), binning and discretisation, interaction and polynomial features, log/Box-Cox/Yeo-Johnson transforms, datetime feature extraction, cyclical encoding (sin/cos), aggregation features, text features (TF-IDF, char n-grams), geospatial features
- **Missing values**: MCAR/MAR/MNAR, deletion, mean/median/mode, KNN imputation, MICE, model-based imputation, missingness indicators
- **Outliers**: detection and treatment, winsorising, when to keep them
- **Hyperparameter tuning**: grid search, random search (and why it beats grid in high dimensions), **Bayesian optimisation** (Optuna, Hyperopt, TPE, Gaussian processes), successive halving, Hyperband, population-based training, early stopping
- **Interpretability**: coefficient interpretation, permutation importance, **SHAP** (Shapley values, TreeSHAP, KernelSHAP, summary and dependence plots), **LIME**, partial dependence plots, ICE plots, accumulated local effects, counterfactual explanations, global vs local explanations, surrogate models
- **Fairness and ethics**: protected attributes, demographic parity, equal opportunity, equalised odds, disparate impact, calibration within groups, the impossibility results, bias sources in data

## 2.5 Deep learning

### Fundamentals
- Perceptron, multilayer perceptron, universal approximation theorem
- Forward pass, **backpropagation** (derive it for a 2-layer network — this is asked), computational graphs, automatic differentiation (forward and reverse mode)
- **Activations**: sigmoid, tanh, ReLU, Leaky ReLU, PReLU, ELU, SELU, **GELU**, SiLU/Swish, softmax, softplus; vanishing and exploding gradients, dying ReLU
- **Loss functions**: MSE, MAE, Huber, binary and categorical cross-entropy, KL divergence, hinge, contrastive, triplet, focal, Dice, CTC
- **Optimisers**: SGD, SGD with momentum, Nesterov, AdaGrad, RMSProp, **Adam** (bias correction), AdamW (decoupled weight decay), LAMB, Lion; know the update rule for at least SGD, momentum, and Adam
- Learning rate schedules: step, exponential, cosine annealing, warm restarts, linear warmup, one-cycle; learning rate finder
- Gradient clipping (by norm, by value)
- **Initialisation**: zero-init problem, Xavier/Glorot, He/Kaiming, orthogonal, why initialisation matters
- **Normalisation**: batch norm (train vs inference behaviour, running statistics, why it helps, batch size dependence), layer norm, group norm, instance norm, RMSNorm, weight norm
- **Regularisation**: L1/L2/weight decay, **dropout** (train vs inference scaling, variants), early stopping, data augmentation, label smoothing, mixup, cutmix, stochastic depth, gradient noise
- Hyperparameters: batch size effects, epochs, generalisation gap
- Mixed precision training, gradient accumulation, gradient checkpointing
- Distributed training: data parallelism, model parallelism, pipeline parallelism, tensor parallelism, ZeRO/FSDP

### CNNs
- Convolution operation, kernels, stride, padding (valid/same), dilation, output size formula, **receptive field** calculation
- Pooling: max, average, global average pooling
- 1x1 convolutions and their purpose
- Depthwise separable convolution, grouped convolution
- Transposed convolution / upsampling
- Parameter counting for a conv layer (frequently asked)
- Architectures: LeNet, AlexNet, VGG, **Inception/GoogLeNet**, **ResNet** (residual connections and why they solve degradation), DenseNet, MobileNet (v1/v2/v3), EfficientNet (compound scaling), ConvNeXt
- Transfer learning, freezing and unfreezing, discriminative learning rates

### Sequence models
- Vanilla RNN, backpropagation through time, vanishing/exploding gradients in RNNs
- **LSTM**: forget/input/output gates, cell state, why it mitigates vanishing gradients
- **GRU**: reset and update gates, LSTM vs GRU tradeoffs
- Bidirectional RNNs, stacked RNNs
- Seq2seq encoder-decoder, teacher forcing, exposure bias
- **Attention**: Bahdanau (additive) vs Luong (multiplicative), why attention was introduced

### Transformers (essential — expect deep probing)
- **Tokenisation**: word-level, character-level, subword; **BPE**, WordPiece, SentencePiece/Unigram; vocabulary size tradeoffs; out-of-vocabulary handling
- Token embeddings, embedding matrix, weight tying
- **Positional encoding**: why needed, sinusoidal, learned, **RoPE** (rotary), ALiBi, relative position encodings
- **Self-attention**: Q, K, V projections, scaled dot-product, **why divide by sqrt(d_k)**, attention weights, softmax
- **Multi-head attention**: motivation, head dimension, concatenation and output projection
- Causal/masked attention, padding masks
- Cross-attention
- Position-wise feed-forward network, expansion ratio
- Residual connections and layer norm placement (**pre-LN vs post-LN** and training stability)
- Full encoder block and decoder block anatomy
- **Architecture families**: encoder-only (BERT, RoBERTa, DeBERTa) for understanding; decoder-only (GPT, LLaMA, Mistral) for generation; encoder-decoder (T5, BART) for seq2seq
- BERT pretraining objectives (MLM, NSP), fine-tuning heads
- **KV cache**: what it stores, why it speeds up generation, memory cost
- **Attention complexity** O(n²) and efficient variants: Flash Attention (IO-awareness, tiling), sparse attention, sliding window attention, linear attention, Performer, Longformer, **MQA and GQA**
- Mixture of Experts (routing, load balancing, sparse activation)

### Generative models
- Autoencoders, denoising autoencoders, sparse autoencoders
- **VAE**: latent variable model, ELBO derivation, reparameterisation trick, KL term, posterior collapse
- **GANs**: generator/discriminator, minimax objective, training instability, mode collapse, WGAN and gradient penalty, conditional GAN, StyleGAN, CycleGAN
- **Diffusion models**: forward noising process, reverse denoising, DDPM, DDIM, classifier-free guidance, latent diffusion (Stable Diffusion), U-Net backbone, noise schedules
- Normalising flows (awareness)
- Autoregressive generation

### Other architectures
- Graph neural networks: message passing, GCN, GraphSAGE, GAT, over-smoothing
- Siamese networks, metric learning, contrastive learning (SimCLR, MoCo), self-supervised learning
- Neural architecture search (awareness)

### Reinforcement learning (needed for RLHF discussions)
- MDP formulation, states, actions, rewards, discount factor, policy, value function, Q-function, Bellman equations
- Value iteration, policy iteration
- Model-free: Monte Carlo, TD learning, SARSA, **Q-learning**, exploration vs exploitation, epsilon-greedy, UCB
- **DQN** (experience replay, target network), Double DQN, Dueling DQN
- Policy gradients: REINFORCE, baselines, actor-critic, A2C/A3C, **PPO** (clipped objective), TRPO, DDPG, SAC
- **Multi-armed bandits**: epsilon-greedy, UCB, Thompson sampling, contextual bandits
- **RLHF**: reward model training, PPO fine-tuning, **DPO** as a simpler alternative, KL penalty against reference model, reward hacking

## 2.6 NLP

- Preprocessing: tokenisation, normalisation, stemming (Porter, Snowball), lemmatisation, stopword removal, n-grams, POS tagging, dependency parsing, constituency parsing, NER, coreference resolution
- Classical representations: bag of words, TF-IDF (derive it), n-gram language models, smoothing (Laplace, Good-Turing, Kneser-Ney), perplexity
- **Word embeddings**: Word2Vec (CBOW vs skip-gram, negative sampling, hierarchical softmax), GloVe (co-occurrence matrix factorisation), FastText (subword), embedding arithmetic and its limitations, bias in embeddings
- Contextual embeddings: ELMo, BERT embeddings, sentence embeddings (Sentence-BERT), embedding models for retrieval (E5, BGE, OpenAI/Cohere embeddings)
- Tasks: text classification, sentiment analysis, NER, relation extraction, question answering (extractive vs abstractive), summarisation, machine translation, text generation, semantic similarity, entity linking, intent classification and slot filling
- Topic modelling: LDA (generative story, Dirichlet priors), NMF, BERTopic
- Metrics: accuracy/F1 for classification, **BLEU**, **ROUGE** (1/2/L), METEOR, chrF, **perplexity**, BERTScore, exact match and F1 for QA
- Multilingual and cross-lingual models

## 2.7 Computer vision

- Image representation, colour spaces, channels, histograms
- Classical CV: filters and convolutions, edge detection (Sobel, Canny), corner detection (Harris), SIFT/SURF/ORB, HOG, image pyramids, morphological operations
- Data augmentation: geometric, colour, cutout, random erasing, AutoAugment, RandAugment
- **Classification**, fine-grained classification
- **Object detection**: two-stage (R-CNN, Fast R-CNN, Faster R-CNN, region proposal network, anchor boxes, RoI pooling/align), one-stage (YOLO family, SSD, RetinaNet with focal loss), anchor-free (FCOS, CenterNet), **DETR** (set prediction, Hungarian matching); **IoU**, **NMS** and soft-NMS, **mAP** computation
- **Segmentation**: semantic (FCN, **U-Net**, DeepLab with atrous convolution), instance (Mask R-CNN), panoptic; Dice coefficient, IoU/Jaccard, Dice loss, combined losses
- Keypoint detection and pose estimation
- Vision transformers: **ViT** (patch embedding, class token), Swin Transformer, DeiT
- Multimodal: **CLIP** (contrastive image-text), BLIP, SAM, vision-language models
- Video: 3D CNNs, two-stream networks, temporal modelling
- OCR pipelines, face detection and recognition, image retrieval
- Medical/3D imaging: volumetric segmentation, nnU-Net-style pipelines (if relevant to your projects)

## 2.8 Generative AI / LLMs — now table stakes, not a bonus

Interviewers in 2026 push well past definitions. Expect design questions, not vocabulary checks.

### LLM foundations
- Pretraining objectives (causal LM, masked LM, span corruption), data curation and deduplication
- Scaling laws (Kaplan, Chinchilla), compute-optimal training, emergent capabilities debate
- Post-training stages: supervised fine-tuning, instruction tuning, preference optimisation (RLHF, DPO, KTO, ORPO), constitutional approaches
- Context window, effective context length, lost-in-the-middle effect
- Tokenisation economics, token counting, cost modelling

### Decoding and control
- Greedy decoding, beam search, sampling
- **Temperature**, **top-k**, **top-p/nucleus**, min-p, typical sampling
- Repetition penalty, frequency and presence penalties
- Constrained decoding, grammar-constrained generation, **structured/JSON output** and schema enforcement
- Speculative decoding, self-consistency

### Prompt engineering
- Zero-shot, few-shot, in-context learning
- **Chain-of-thought**, self-consistency, least-to-most, tree of thoughts, ReAct, Reflexion
- System prompts, role prompting, delimiters, output format specification
- Prompt chaining and decomposition
- Prompt versioning and evaluation as an engineering discipline

### RAG (expect a full design question)
- Why RAG: grounding, freshness, auditability, cost vs fine-tuning
- Ingestion pipeline: loading, parsing (PDF, tables, HTML), cleaning
- **Chunking strategies**: fixed-size, sliding window with overlap, sentence/paragraph, recursive character, semantic chunking, document-structure-aware, parent-document retrieval, small-to-big; chunk size tradeoffs
- **Embeddings**: model selection, dimensionality, domain adaptation, normalisation
- **Vector databases**: Pinecone, Weaviate, Qdrant, Milvus, Chroma, FAISS, pgvector, Elasticsearch dense vectors
- **Indexing algorithms**: flat/brute force, **HNSW** (graph structure, ef and M parameters), IVF, IVF-PQ, product quantisation, LSH, ScaNN; recall vs latency tradeoff
- Similarity metrics: cosine, dot product, Euclidean; when normalisation matters
- **Hybrid search**: BM25 + dense, reciprocal rank fusion, weighted fusion
- **Reranking**: cross-encoders, ColBERT/late interaction, commercial rerankers, latency budget
- Query understanding: query rewriting, query expansion, HyDE, multi-query, step-back prompting, routing
- Advanced patterns: multi-hop RAG, GraphRAG, agentic RAG, self-RAG, corrective RAG, contextual retrieval
- Metadata filtering, access control in retrieval
- Context assembly, ordering, deduplication, citation generation
- **RAG evaluation**: retrieval metrics (recall@k, precision@k, MRR, NDCG), generation metrics, **RAGAS** framework (faithfulness, answer relevance, context precision, context recall), golden datasets, LLM-as-judge
- Failure modes: poor chunking, embedding mismatch, retrieval of irrelevant context, context overflow, conflicting sources

### Fine-tuning and adaptation
- When to fine-tune vs prompt vs RAG (the decision framework is the actual question)
- Full fine-tuning, cost and catastrophic forgetting
- **PEFT**: **LoRA** (low-rank decomposition, rank r, alpha scaling, target modules), **QLoRA** (4-bit NF4, double quantisation, paged optimisers), adapters, prefix tuning, P-tuning v2, IA³
- Instruction dataset construction, quality vs quantity, synthetic data generation
- **Quantisation**: post-training vs quantisation-aware, INT8, INT4, GPTQ, AWQ, GGUF, bitsandbytes; accuracy-latency tradeoffs
- **Distillation**: teacher-student, response vs feature distillation
- Pruning, sparsity
- Continual pretraining for domain adaptation

### Agents
- **Tool/function calling**: schema definition, argument parsing, error handling, tool selection
- **ReAct loop**: reason, act, observe, repeat
- Planning: decomposition, plan-and-execute, hierarchical planning
- **Memory**: short-term (conversation buffer), long-term (vector store), episodic, summarisation-based, entity memory
- Multi-agent systems: supervisor/worker, sequential, hierarchical, debate; handoffs and shared state
- Frameworks: **LangChain**, **LangGraph** (stateful graphs with cycles, nodes, edges, checkpointing), LlamaIndex, CrewAI, AutoGen, OpenAI Agents SDK
- **MCP (Model Context Protocol)**: standardised tool/resource exposure, servers and clients
- Human-in-the-loop, approval gates, interrupts
- Failure modes: infinite loops, tool misuse, cost explosion, error propagation; mitigations (step limits, budgets, validation)

### Serving, evaluation, safety
- Inference stacks: vLLM (PagedAttention, continuous batching), TGI, TensorRT-LLM, Ollama
- Latency optimisation: TTFT vs TPOT, batching, streaming, prompt caching, semantic caching, model routing/cascading
- Cost modelling: input vs output token pricing, caching discounts, small-model routing
- **Evaluation**: golden datasets, LLM-as-judge (and its biases), pairwise comparison, rubrics, human evaluation, regression suites, benchmarks (MMLU, GSM8K, HumanEval, HELM, LMSYS Arena), online A/B testing of prompts
- Observability: tracing (LangSmith, Langfuse, Phoenix), token and cost tracking, latency percentiles
- **Safety**: **hallucination** (causes: parametric gaps, conflicting context, decoding randomness; mitigations: grounding, citation, abstention, verification chains), **prompt injection** (direct and indirect) and defences, jailbreaking, data exfiltration, PII detection and redaction, content filtering and guardrails (NeMo Guardrails, Llama Guard), OWASP Top 10 for LLM applications, model and data governance

## 2.9 Experimentation and product analytics (essential for product DS roles)

- **A/B test design**: hypothesis, randomisation unit, assignment mechanism, SRM (sample ratio mismatch) checks, A/A tests
- **Sample size and power**: minimum detectable effect, power analysis, baseline variance, duration calculation, weekly seasonality
- Primary, secondary, and **guardrail metrics**; overall evaluation criterion
- **Pitfalls**: peeking/early stopping, multiple comparisons, novelty and primacy effects, network effects and interference, SUTVA violations, simpson's paradox in segments, seasonality, outliers in metrics
- Sequential testing, always-valid inference, group sequential designs
- **Variance reduction**: CUPED, stratification, regression adjustment
- **Bandits** vs A/B tests, when each is appropriate
- Switchback experiments, geo experiments, synthetic control
- Interference in marketplaces and social networks, cluster randomisation
- Metric design: north star metric, input vs output metrics, leading vs lagging indicators, counter metrics, metric sensitivity
- Product metrics: DAU/WAU/MAU, stickiness, **retention** (n-day, unbounded, rolling, cohort curves), churn, resurrection, **funnel and conversion**, activation, LTV, CAC, ARPU, session metrics, engagement depth
- **Root cause analysis**: "metric X dropped 8% — diagnose it" (segment by dimension, check instrumentation, check seasonality, check external events, check upstream funnel)
- Launch decisions under ambiguity, tradeoff between metrics
- Guesstimates and market sizing
- Case structuring, MECE, hypothesis-driven analysis

## 2.10 MLOps and production

- Project structure, reproducibility, seeding, environment pinning
- **Experiment tracking**: MLflow, Weights & Biases, Neptune; model registry, model versioning
- **Data versioning**: DVC, LakeFS, dataset cards
- **Pipelines/orchestration**: Airflow (DAGs, operators, scheduling), Prefect, Dagster, Kubeflow, Metaflow
- **Serving**: FastAPI/Flask REST endpoints, batch vs real-time vs streaming inference, async inference, TorchServe, Triton, ONNX Runtime, model quantisation for serving
- **Containerisation**: Docker for ML, GPU containers, image size optimisation
- **Orchestration**: Kubernetes basics, autoscaling, GPU scheduling
- **CI/CD for ML**: automated testing (data validation with Great Expectations/Pandera, model tests, integration tests), automated retraining triggers
- **Monitoring**: data drift (KS test, PSI, Wasserstein, chi-square), concept drift, feature drift, prediction drift, performance monitoring with delayed labels, outlier detection in production, alerting thresholds, shadow deployment, canary release, champion-challenger
- **Feature stores**: Feast, Tecton; online vs offline stores; **training-serving skew**; point-in-time correctness
- Cloud platforms: AWS (SageMaker, S3, EC2, Lambda, Glue, Athena), GCP (Vertex AI, BigQuery, Dataflow), Azure ML
- Cost optimisation: spot instances, GPU utilisation, batch scheduling, model right-sizing
- Governance: model cards, lineage, audit trails, compliance

## 2.11 Big data

- Distributed computing fundamentals, shared-nothing architecture
- Hadoop ecosystem, HDFS (blocks, replication, NameNode/DataNode), MapReduce paradigm (map, shuffle, reduce), YARN
- **Spark**: architecture (driver, executors, cluster manager), RDDs, DataFrames, Datasets, **lazy evaluation**, transformations vs actions, narrow vs wide dependencies, **shuffles** and why they are expensive, partitioning and repartitioning, broadcast joins, caching and persistence levels, Catalyst optimiser, Tungsten, **data skew** handling (salting), AQE, PySpark API, Spark SQL, window functions in Spark, UDFs and why they are slow
- Streaming: **Kafka** (as in Part 1), Spark Structured Streaming, Flink, watermarks, windowing (tumbling, sliding, session), exactly-once semantics
- **Data warehousing**: Snowflake, BigQuery, Redshift, Databricks; dbt for transformation; ETL vs ELT
- **Data lakes and lakehouse**: Delta Lake, Iceberg, Hudi; ACID on object storage; time travel
- File formats: CSV vs JSON vs **Parquet** vs ORC vs Avro; columnar vs row storage; compression and predicate pushdown
- Data modelling: star and snowflake schema, fact and dimension tables, slowly changing dimensions (Type 1/2/3), data vault
- Data quality: completeness, accuracy, consistency, timeliness; testing frameworks

## 2.12 DSA for DS roles

Do not skip this. Most DS roles at 35+ LPA still run a coding round.

- Arrays, strings, hashing, two pointers, sliding window
- Sorting and searching including binary search on answer
- Stacks, queues, heaps
- Trees and graphs (BFS/DFS, shortest path at least)
- Dynamic programming (standard patterns)
- Recursion and backtracking
- Complexity analysis
- **Plus DS-specific coding**: implementing algorithms from scratch in NumPy (k-means, linear/logistic regression with gradient descent, KNN, PCA, k-fold CV, gradient descent variants, attention mechanism, a small MLP with manual backprop), matrix manipulation problems, probability simulation
- Pandas/SQL live coding on a provided dataset

## 2.13 DS interview anatomy by company archetype

**Product DS (Meta, Uber, Flipkart, Swiggy, Zomato, Google product analytics)**
- Heavy SQL (2 rounds sometimes), statistics and experimentation, product sense, metric design, light ML, case-style RCA

**ML Engineer (Google, Microsoft, Amazon, AI startups)**
- DSA round + ML fundamentals depth + ML system design + coding an algorithm from scratch + production/MLOps discussion

**Applied Scientist / Research (Amazon AS, Adobe, Microsoft Research, Samsung R&D)**
- Deep ML theory, derivations on a whiteboard, paper discussion, novel problem formulation, strong coding

**Quant / Data at trading firms (Tower Research, Graviton, Quadeye, WorldQuant, DE Shaw, Optiver, Jane Street)**
- Probability puzzles, expected value, brainteasers, mental maths speed, statistics, market-making games, sometimes hard DSA. **These typically have the highest CGPA cutoffs** — assess realistically at 7.15

**GenAI / AI Engineer (new-age startups, AI-first teams)**
- LLM system design, RAG architecture, agent design, practical shipping stories, evaluation strategy, cost/latency reasoning

**Analytics / Consulting-tech (QuantumBlack, ZS, Bain Advanced Analytics)**
- SQL + business cases + guesstimates + stakeholder communication + visualisation

---

# PART 3 — THE IDEAL CV AT YOUR PROFILE

This section describes the **target state**, independent of what you currently have. Treat it as a gap-analysis checklist.

## 3.1 Format constraints (IIT KGP CDC)

- **Strictly one page.** The CDC template is mandatory for campus applications; a separate polished version is used for off-campus and referrals
- Reverse chronological within each section
- Sections in typical order: Education → Internships/Experience → Projects → Positions of Responsibility → Awards and Achievements → Skills → Coursework → Extracurriculars
- Every bullet: action verb, method, quantified outcome. No bullet without a number unless genuinely unquantifiable
- No photo, no objective statement, no "references available on request"
- Verifiable claims only — every number will be interrogated in the project round

## 3.2 Education section — ideal state

- B.Tech, Manufacturing Science and Engineering, IIT Kharagpur, CGPA and year
- **Micro-specialisation or minor in CS / AI-ML if available.** This is the single most direct branch-compensator on paper and IIT KGP offers micro-specialisations that non-CS students can take
- Class 12 and Class 10 percentages if above roughly 92%
- **JEE Advanced All India Rank if within roughly top 2000** — a strong AIR partially offsets a weak CGPA in the recruiter's mental model
- Relevant coursework line: Data Structures, Algorithms, DBMS, Operating Systems, Computer Networks, OOP, Machine Learning, Probability and Statistics, Linear Algebra, Optimisation

## 3.3 Internships — ideal state

**For SDE (in descending order of value)**
1. Summer SDE internship at a top-tier product company (Google, Microsoft, Uber, Rubrik, Atlassian, Salesforce, Adobe, Databricks, or a well-funded unicorn) **with a PPO/PPI in hand**
2. **GSoC / LFX Mentorship / MLH Fellowship** with merged upstream contributions — this is the single best equaliser for a low-CGPA non-CS candidate because it is externally verifiable and prestige-neutral to branch
3. SDE internship at a Series B+ startup where you shipped a named feature to production with a measured impact
4. Two internships showing progression (smaller → larger, or intern → returning intern)

**For Data Science (in descending order of value)**
1. **Research internship abroad** (MITACS Globalink, DAAD WISE, Charpak, Khorana, NUS/NTU research programmes, or direct professor outreach) **resulting in a paper or preprint**
2. Research under an IIT KGP faculty in an AI centre (AI4ICPS, Centre of Excellence in AI) **with a publication or submitted paper**
3. DS/ML internship at a product company or a funded AI startup with a model shipped to production and a business metric moved
4. **A first-author or co-author publication at a recognised venue** (a workshop paper at NeurIPS/ICML/ACL/CVPR, or a solid conference paper) — for DS this is worth more than most internships and is fully CGPA-blind

**What each internship bullet must contain**
- The problem and its scale (users, data volume, latency budget, cost)
- What you specifically built (not what the team built)
- The measurable delta (latency reduced X%, accuracy improved Y points, cost cut Z%, revenue/retention impact)
- The technology, stated once, not as a list

## 3.4 Projects — ideal state

**Rule: 2–4 projects, deep. Not 6 projects, shallow.** A recruiter reading 6 projects assumes none are real.

**SDE ideal project mix**
1. **One systems project that signals depth** — a distributed key-value store with Raft, a mini database with a query planner, a toy compiler or interpreter, an HTTP server from scratch, a container runtime, a custom load balancer, a lock-free data structure library. This is what separates "did tutorials" from "understands computers"
2. **One product with real users** — deployed, with genuine usage numbers (500+ users is credible and defensible; 50 is not impressive but is honest; fabricated 10,000 is fatal)
3. **One performance/optimisation project** with before-and-after benchmarks — profiling, algorithmic improvement, concurrency, memory optimisation
- Every project: public GitHub, real README with architecture diagram, tests, CI badge, meaningful commit history over weeks not one dump commit

**DS ideal project mix**
1. **One end-to-end ML system in production**, not a notebook — data pipeline, training pipeline, deployed API, monitoring, drift detection, retraining trigger. This is the highest-signal DS project because 95% of student DS projects stop at the notebook
2. **One GenAI/LLM system built from primitives with real evaluation** — a RAG or agentic system where you can explain chunking choices, embedding selection, retrieval metrics, and a documented eval harness. Gluing LangChain calls together is not a project; a system with a measured retrieval recall@k and faithfulness score is
3. **One research-flavoured project** — reproducing a paper and extending it, with an honest results table including where it failed
4. **One competition result** — Kaggle top 10% (bronze) minimum, medal preferred
- Every project: dataset provenance stated, baseline comparison, honest failure analysis, metrics that match the problem (not accuracy on an imbalanced dataset)

## 3.5 Achievements and competitions — **this is where your CV is actually won**

Given CGPA 7.15 and a non-CS branch, this section carries more weight than any other. Ideal state:

**SDE**
- **Codeforces Candidate Master (1900+)** — the target. Expert (1600+) is the minimum to list
- CodeChef 5-star, LeetCode Knight/Guardian, AtCoder rating
- **ICPC Regionals qualification** (Preliminaries in Oct–Nov, Regionals typically Dec–Jan). Rank within top 100 at Regionals is very strong
- **Inter-IIT Tech Meet medal** — weighted heavily at KGP and highly visible to recruiters
- **Smart India Hackathon win**
- Corporate hackathon wins: Flipkart GRiD, Amazon ML Challenge, Adobe, Microsoft Engage, American Express Makeathon, Barclays Hack-o-Hire
- Meta Hacker Cup / Google contest rounds cleared

**DS**
- **Kaggle Competitions Expert or Master** (medals, not just participation)
- **Publication** with a venue name
- Amazon ML Challenge / Flipkart GRiD DS track / Analytics Vidhya top ranks
- Inter-IIT Tech Meet ML problem statement medal
- Research grants, best paper awards

**Both**
- KVPY, NTSE, INSPIRE, Olympiad results (INMO, NSEP/NSEC/NSEA, IOQM), institute merit scholarships
- JEE Advanced AIR if strong

## 3.6 Positions of Responsibility — ideal state

- **Tech-society PORs outrank general PORs for these roles**
- Highest value at KGP: **Kharagpur Data Analytics Group (KDAG)** for DS, **Kharagpur Open Source Society (KOSS)** for SDE, Technology Adventure Society, Google Developer Student Club lead, Coding Club, Society for AI and Deep Learning
- Head/Governor-level roles at Technology Students' Gymkhana carry institute-wide weight
- Hall/departmental PORs are acceptable but secondary for tech roles
- Every POR bullet needs a number: people managed, budget handled, events run, participants reached, growth achieved
- **Debate/MUN/quiz PORs are a genuine asset for hiring-manager rounds** but do not substitute for technical signal

## 3.7 Skills section — ideal state

- Tiered and honest: Languages | Frameworks and Libraries | Databases | Tools and Platforms | CS Fundamentals
- **Maximum ~15 items.** A 35-item skills list reads as noise and invites a question on the weakest item
- Never list something you cannot discuss for 15 minutes
- For SDE: C++, Python, SQL, one backend framework, Git, Docker, Linux, one cloud, DSA/OS/DBMS/CN/OOP
- For DS: Python, SQL, PyTorch or TensorFlow, scikit-learn, pandas/NumPy, Spark, Docker, MLflow, one cloud, one vector DB, LangChain/LangGraph

## 3.8 Benchmark table — what "competitive at 35+ LPA" looks like

| Dimension | Minimum to be shortlisted | Genuinely competitive | Overrides CGPA concerns |
|---|---|---|---|
| CGPA | 7.0 | 8.0+ | 9.0+ |
| Codeforces (SDE) | 1600 (Expert) | 1900 (CM) | 2100+ (Master) |
| Kaggle (DS) | 1 bronze medal | Competitions Expert | Competitions Master |
| Internships | 1 relevant | 1 brand-name or research | Brand-name with PPO |
| Publications (DS) | 0 | 1 workshop paper | 1 conference paper |
| Projects | 2 solid | 3 with one systems-depth project | 1 with real users at scale |
| Open source | none | consistent contributions | GSoC / LFX selected |
| Competitions | 1 hackathon | Inter-IIT / SIH finalist | Inter-IIT medal / SIH winner |
| POR | 1 | 1 tech-society role | Head of a tech society |

## 3.9 The leverage ranking — what actually compensates for 7.15 + Manufacturing

In descending order of return per hour invested, given a 16-week horizon:

1. **Codeforces rating climb** (SDE) — fastest-moving verifiable signal, entirely under your control, CGPA-blind
2. **Kaggle medal** (DS) — same logic, achievable within 6–10 weeks of focused effort on one competition
3. **Deep CS fundamentals mastery** — does not appear on the CV but is what actually converts interviews; non-CS candidates fail here disproportionately
4. **One flagship project with genuine users and honest metrics** — gives you a 20-minute story you can defend, which is what the project round tests
5. **Micro-specialisation / CS minor** — if you can still register, this directly answers "why should we hire a Manufacturing student for SDE"
6. **Open source contributions** — merged PRs to a known repository, visible on GitHub, verifiable in seconds
7. **Inter-IIT Tech Meet participation** — the season aligns with your timeline and a medal is disproportionately weighted at KGP
8. **A crisp, rehearsed answer to "why not core"** — this question is asked in every hiring manager round for off-branch candidates, and a weak answer costs offers

## 3.10 Red flags to eliminate

- More than four projects, or projects that are clearly tutorial follow-alongs
- A skills section with 30 items
- Any number you cannot reproduce or explain the measurement methodology for
- Kaggle notebooks presented as "machine learning systems"
- MOOC certificates listed under achievements
- No GitHub link, or a GitHub with empty repos and no commit history
- Bullets that describe responsibilities rather than outcomes ("worked on", "was responsible for", "assisted with")
- Buzzword stacking without a system behind it (listing "LangChain, RAG, agents" with a 200-line project)
- Inconsistent tense, inconsistent date formats, spelling errors — these read as carelessness and cost more than people expect
- The same generic CV sent to SDE and DS roles; maintain two versions

---

# PART 4 — 16-WEEK EXECUTION PLAN (10 Aug → 1 Dec 2026)

## Phase 1 — Weeks 1–4 (Aug): Foundations and rating push

**Daily (SDE primary, DS secondary — adjust if you invert)**
- 3 hours DSA: work through weak topic areas systematically, not randomly
- 1.5 hours CS fundamentals: one subject at a time, OS first (most commonly tested), then DBMS, then CN, then OOP
- 1 hour DS track: SQL practice daily (StrataScratch/DataLemur) + one ML topic
- 2–3 rated Codeforces contests per week, upsolve every problem within 48 hours

**Milestones by end of Week 4**
- CSES problem set: at least 150 problems done
- OS and DBMS completed end to end with notes
- SQL: comfortable with window functions and cohort queries
- Codeforces: measurable rating movement

## Phase 2 — Weeks 5–8 (Sep): Depth, projects, CV freeze

- Continue DSA and contests at the same cadence
- Complete CN and OOP
- **Start LLD**: design patterns + 2 problems per week, coded out
- **Finish and polish the flagship project** — README, deployment, metrics, tests
- **Freeze the CV by end of Week 8.** Get it reviewed by seniors who have converted your target companies, not by peers
- DS track: pick one Kaggle competition and commit to it seriously through Week 10
- Register for ICPC Preliminaries if the window is open

**Milestones by end of Week 8**
- All four CS core subjects done with revision notes
- 10+ LLD problems implemented
- Two CV versions final (SDE and DS)
- CSES: 250+ problems

## Phase 3 — Weeks 9–12 (Oct): OA season and interview conversion

- **OAs begin.** Treat every OA as a timed contest; simulate conditions
- Shift DSA practice to timed sets: 3 problems in 90 minutes, medium-hard mix
- **Start HLD**: 2 system design problems per week, written out with estimation
- Continue LLD at 2 problems per week
- **Mock interviews: 2 per week minimum**, with people who will actually be harsh
- Prepare project deep-dive answers: for each CV line, a 2-minute version and a 15-minute version, plus answers to "what would you do differently", "what broke", "how did you measure that"
- Behavioural prep: STAR stories for failure, conflict, ownership, ambiguity, and the "why not core branch" question

**Milestones by end of Week 12**
- 20+ HLD and LLD problems covered
- 15+ mock interviews done
- Every CV claim stress-tested

## Phase 4 — Weeks 13–16 (Nov): Revision and peak

- No new topics. Revision only
- Daily: 2 problems from your wrong-answer log, 1 hour CS fundamentals revision, 1 design problem
- Company-specific prep: for each shortlisted company, study their interview patterns from placement archives and past-year experiences
- Sleep schedule fixed to interview hours by mid-November
- Keep contests running for sharpness, but stop chasing rating in the final two weeks

## Ongoing throughout

- **Maintain a single revision document**: every mistake, every concept gap, every interview question you could not answer. This becomes your Week 13–16 study material
- **Track applications and cutoffs**: pull historical CGPA cutoff data for every target company from CDC records and seniors; do not waste effort on companies whose cutoff you cannot clear
- **Talk to seniors who converted your target companies.** Their specific round-by-round accounts are worth more than any generic resource

---

## Resource shortlist (quality over quantity)

**DSA/CP**: CSES Problem Set, Codeforces (EDU section + problemset by tag/rating), USACO Guide, AtCoder DP Contest, Competitive Programmer's Handbook (Laaksonen), CP-Algorithms

**CS fundamentals**: Operating System Concepts (Silberschatz), Database System Concepts (Silberschatz), Computer Networking: A Top-Down Approach (Kurose & Ross), Neso Academy/Gate Smashers for fast coverage

**LLD**: Head First Design Patterns, Refactoring Guru, awesome-low-level-design repositories

**HLD**: Designing Data-Intensive Applications (Kleppmann — the single best book here), System Design Interview Vol 1 & 2 (Alex Xu), ByteByteGo, engineering blogs (Uber, Netflix, Meta, Discord, Cloudflare)

**ML**: Introduction to Statistical Learning, Elements of Statistical Learning, Pattern Recognition and Machine Learning (Bishop), Hands-On ML (Géron), Andrew Ng's courses

**DL**: Deep Learning (Goodfellow), fast.ai, Karpathy's Zero to Hero series and "Let's build GPT", Dive into Deep Learning

**LLM/GenAI**: The Illustrated Transformer, Anthropic and OpenAI documentation, LangGraph docs, RAG papers, Hugging Face NLP course

**Stats/Product**: Practical Statistics for Data Scientists, Trustworthy Online Controlled Experiments (Kohavi), Ace the Data Science Interview

**SQL**: StrataScratch, DataLemur, LeetCode Database, Mode SQL Tutorial
