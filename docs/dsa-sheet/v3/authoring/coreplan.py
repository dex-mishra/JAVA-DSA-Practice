import json, datetime, os, sys
OUT = sys.argv[1]
S = datetime.date(2026, 10, 18)
A = [  # plan days 1-30, 45 min
 ("OOP & C++", ["Classes, objects and their memory", "Constructors and destructors"], ["oop-classes-objects-memory", "oop-constructors-destructors"], None),
 ("OOP & C++", ["Encapsulation and access control", "Abstraction, abstract classes and interfaces"], ["oop-encapsulation-access", "oop-abstraction-interfaces"], None),
 ("OOP & C++", ["Inheritance: types, access modes, construction order", "Diamond problem and virtual inheritance"], None, None),
 ("OOP & C++", ["Static polymorphism: overloading, operator overloading, templates", "Dynamic polymorphism: virtual, vtable/vptr, override, slicing, virtual destructors"], None, None),
 ("OOP & C++", ["Memory: stack vs heap, new/delete, smart pointers and RAII", "Copy vs move semantics; rule of three / five / zero"], None, None),
 ("OOP & C++", ["STL internals: vector growth, map (red-black tree), unordered_map (buckets)", "Keywords: static, const, inline, extern, volatile, mutable"], None, "OOP + C++ revision quiz (15 MCQs)"),
 ("DBMS", ["What a DBMS is; keys: super, candidate, primary, foreign", "ER model: entities, relationships, cardinality"], None, None),
 ("DBMS + SQL", ["Relational model and relational algebra", "SQL basics: SELECT, WHERE, ORDER BY, GROUP BY, HAVING"], None, "SQL 50: 3 problems"),
 ("DBMS + SQL", ["Joins: inner, left/right/full outer, self, cross", "Subqueries and correlated subqueries"], None, "SQL 50: 3 problems"),
 ("DBMS", ["Functional dependencies and closures", "Normalisation: 1NF, 2NF, 3NF, BCNF; denormalisation"], None, None),
 ("DBMS", ["Transactions and ACID", "Schedules and serialisability (conflict, view)"], None, None),
 ("DBMS", ["Concurrency control: locks, two-phase locking, deadlocks in DBs", "Isolation levels and anomalies (dirty, non-repeatable, phantom reads)"], None, None),
 ("DBMS", ["Indexing: B-tree and B+ tree", "Clustered vs non-clustered indexes; when an index hurts"], None, None),
 ("DBMS + SQL", ["Window functions and CTEs", "Classic queries: Nth highest salary, duplicates, ranking"], None, "SQL 50: 4 problems"),
 ("DBMS", ["SQL vs NoSQL (document, key-value, column, graph)", "Replication, sharding and partitioning basics"], None, "DBMS revision quiz (15 MCQs)"),
 ("OS", ["What an OS does; kernel, user vs kernel mode", "System calls and interrupts"], None, None),
 ("OS", ["Processes: PCB, states, context switch", "Threads vs processes; user vs kernel threads"], None, None),
 ("OS", ["CPU scheduling: FCFS, SJF, SRTF, Round Robin, priority", "Scheduling numericals: waiting and turnaround time"], None, None),
 ("OS", ["Race conditions and the critical-section problem", "Mutex, semaphores (binary, counting), monitors"], None, None),
 ("OS", ["Producer–consumer and readers–writers", "Dining philosophers"], None, None),
 ("OS", ["Deadlock: four conditions, resource-allocation graph", "Prevention, avoidance (Banker's), detection and recovery"], None, None),
 ("OS", ["Memory management: contiguous allocation, fragmentation", "Paging, page tables, TLB; segmentation"], None, None),
 ("OS", ["Virtual memory and demand paging; page faults", "Page replacement: FIFO, LRU, Optimal; Belady's anomaly; thrashing"], None, None),
 ("OS", ["File systems and inodes", "Disk scheduling: FCFS, SSTF, SCAN, C-SCAN"], None, "OS revision quiz (15 MCQs)"),
 ("CN", ["OSI vs TCP/IP models: what each layer does", "Devices: hub, switch, router; collision vs broadcast domains"], None, None),
 ("CN", ["IP addressing, subnetting, CIDR", "NAT, ARP, DHCP"], None, None),
 ("CN", ["TCP vs UDP; three-way handshake and teardown", "Flow control and congestion control"], None, None),
 ("CN", ["DNS resolution", "HTTP vs HTTPS, TLS handshake, cookies and sessions"], None, None),
 ("CN", ["What happens when you type a URL — end to end", "Sockets, ports, REST basics"], None, None),
 ("All", ["Cross-subject revision from your recall boxes", "Weak-topic rewrite"], None, "Mixed CS quiz (30 MCQs)"),
]
B = [  # Nov 17-30, ~3 h
 ("LLD", ["From OOP to LLD; class relationships: association, aggregation, composition, dependency", "UML: class and sequence diagrams"], None),
 ("LLD", ["SOLID principles with C++ examples", "DRY, KISS, YAGNI; coupling and cohesion"], None),
 ("LLD", ["Creational patterns: Singleton, Factory, Builder", "Structural patterns: Adapter, Decorator, Facade"], None),
 ("LLD", ["Behavioural patterns: Strategy, Observer, State, Command", "Machine-coding playbook: clarify, model, structure, code, demo"], None),
 ("LLD practice", ["Machine coding: Parking Lot in C++ (90 min) + review checklist"], "machine coding"),
 ("LLD practice", ["Machine coding: Splitwise or Snake & Ladder (90 min)", "Design discussion: Elevator system"], "machine coding"),
 ("System design", ["Client–server, latency vs throughput, scaling up vs out", "Availability, consistency, CAP and PACELC"], None),
 ("System design", ["Load balancers and reverse proxies; CDNs", "Caching: strategies, eviction, invalidation"], None),
 ("System design", ["Databases at scale: replication, sharding, partitioning", "Queues, async processing, rate limiting, idempotency, API design"], None),
 ("HLD", ["The design framework: requirements → estimates → API → data → architecture → scaling", "Design: URL shortener"], "design"),
 ("HLD", ["Design: rate limiter", "Design: notification system"], "design"),
 ("HLD", ["Design: chat (WhatsApp-style)", "Design: ticket booking (BookMyShow)"], "design"),
 ("HLD", ["Design: news feed", "LLD + HLD revision from notes"], "design"),
 ("All", ["Full CS revision from recall boxes", "Mock: 20 CS MCQs + 1 design discussion"], None),
]
days = []
for i, (subj, topics, ids, extra) in enumerate(A, 1):
    days.append(dict(day=i, date=(S + datetime.timedelta(days=i - 1)).isoformat(), phase="plan", minutes=45,
                     subject=subj, topics=[dict(title=t, page=(ids[k] if ids else None)) for k, t in enumerate(topics)],
                     extra=extra, content="ready" if ids else "pending"))
N = datetime.date(2026, 11, 17)
for k, (subj, topics, kind) in enumerate(B):
    days.append(dict(day=None, date=(N + datetime.timedelta(days=k)).isoformat(), phase="intensive", minutes=180,
                     subject=subj, topics=[dict(title=t, page=None) for t in topics], extra=kind, content="pending"))
plan = dict(version=1, title="CS core plan", basis="IIT campus SDE interviews: OS, DBMS (+SQL), OOP/C++ internals, CN asked broadly; LLD/machine coding at Indian product companies; system design light for freshers.",
            daily_format=["read topic 1 in the reader (detail sections), write its note", "answer its recall questions before revealing",
                          "same for topic 2", "MCQs (5–6)", "2-minute explanation (typed, Groq-graded)", "practice where listed (SQL 50 / machine coding / design)"],
            minimum_for_bad_days="one topic: note + recall", lld_language="C++",
            days=days)
json.dump(plan, open(os.path.join(OUT, "CORE-PLAN.json"), "w"), indent=1, ensure_ascii=False)
print(len(days), "core days")
