# DSA tab — PRD v3.1: guided redesign, reading flow, notes, CS core

**Audience:** Claude Code, in this repository, after v3 is live.
**Builds on:** `PRD-v3.md` (data model, scheduling, mocks, notifications stay as they are). This document changes **how the DSA section looks and guides**, adds the **reader** (reading flow with return), **outline notes**, **CS core**, and a **content-format extension**.
**Content shipped with this PRD:** Days 1–2 fully in the new format; CS core Days 1–2; notes for the 19 theory pages Days 1–2 rely on; `CORE-PLAN.json` for all of CS core. Days 3–30 keep working in the v3 format until their batches are upgraded (graceful fallback, §12).

Read this whole file before changing code.

---

## 0. Decisions (do not reopen)

| # | Decision |
|---|---|
| G1 | The DSA section must **guide**: there is always one obvious next action, and every screen says in one short line what to do and why. |
| G2 | Depth stays. Nothing is removed from the content; it is layered: **essentials visible, detail one click away, never more than one level deep.** |
| G3 | Reading is a **flow**. Theory opens *inside* the reader, and every jump (detour) returns to the exact place it came from. The user never loses their place, even across sessions. |
| G4 | Notes are **outlines**: numbered topics → • pointers → ◦ sub-pointers, with an "✎ In my words" line, a **Recall** box (questions → answers) and a **Screenshot card**. |
| G5 | Every theory reference states **which page/section, where it is used, why, and when to read it** (before / while / stuck / after), and whether it is **must** or optional. |
| G6 | CS core: 7 subjects (OOP+C++, DBMS+SQL, OS, CN during Days 1–30 at 45 min/day; LLD, system-design fundamentals, HLD during Nov 17–30 at ~3 h/day). LLD in **C++**. |
| G7 | Total daily load ≈ 4 hours is accepted by the user. |
| G8 | Four tabs replace seven: **Today · Plan · Library · Revision · OAs** (Browse moves into Plan; Patterns and Theory merge into Library). |

---

## 1. What is wrong with the live build (observed on the deployed site)

1. A long "How this plan works" panel sits above Today on every visit.
2. Placement/MBA stat tiles fill the top of the DSA page before anything DSA-related.
3. All blocks of the day render expanded at once (5 full drill statements, the full CS card, 4 problem rows).
4. An open problem is one long scroll: 10 stages + stuck ladder + AI box + 6 form fields + 13 tag buttons.
5. Theory references are chips with the **why hidden in a tooltip** and no **when**; on theory pages "Used by N" names problems but not where or why.
6. Opening a theory page leaves the problem; coming back means scrolling to find your place again.
7. Notes are tagged per line (✍️/📸) but ~70% of a pattern page is ✍️ — too much to hand-write and not structured as notes.

---

## 2. UX principles (apply everywhere)

- **One next action.** Every screen has exactly one primary button. Secondary actions are text links or icons.
- **Progressive disclosure, one level.** Essentials visible; detail behind one click ("Show details", "More"). Never nest a collapsible inside a collapsible inside a collapsible.
- **One path to each thing.** A theory section is always opened through the reader (never a raw page jump).
- **Helper lines.** Every screen and every step shows one helper line: ≤ 15 words, imperative, says *what* and *why* (catalogue in §10).
- **Signifiers.** Anything hidden shows that it exists: "3 more steps", "Details ▸", a count badge.
- **Plain words.** "Today's minimum" (not "floor"), "Try it cold" (not "APPLY role semantics").
- **Persistence.** Every place the user can be (day, problem step, reader step, detour stack, scroll anchor, mode) is restorable after a reload.

---

## 3. Information architecture

| Tab | Purpose | Replaces |
|---|---|---|
| **Today** | The guided day: next-up card + day checklist. Default landing tab. | sheet / Today |
| **Plan** | 30-day grid (DSA) + CS core plan + Browse (filters) as a sub-view. | plan, browse |
| **Library** | All theory: DSA pages + CS core pages, search, patterns list, notes status. | theory, patterns, templates |
| **Revision** | Everything due: re-solves, recall misses, queued problems, drill misses, low-confidence, starred. | revision |
| **OAs** | Unchanged from v3 (mock schedule, unlock, attempts) + CS MCQ section when mocks include it later. | OAs |

**Shared header while inside the DSA section:** collapse the placement/MBA tile grid into one slim bar (rating, days to placements). The full grid stays on the Placement tab. Do not change Placement/MBA rendering anywhere else.

**Routes** (hash-based, all restorable):
`#dsa/today` · `#dsa/day/<n>` · `#dsa/problem/<id>/<stage>` · `#dsa/read/<pathKey>/<step>` · `#dsa/page/<pageId>/<section>?mode=read|notes|revise` · `#dsa/plan` · `#dsa/library` · `#dsa/revision` · `#dsa/oa`.

---

## 4. Today (focus view)

### 4.1 Layout
```
Day 1 · Array traversal and in-place writes      Mock 01 · Fri 23 Oct · 6 days     ✓ 3 / 12
┌ NEXT UP ─────────────────────────────────────────────────────────────────────────┐
│ READ · Today's reading path — step 3 of 7 · "Five-slot pseudocode"   ~3 min     │
│ The pseudocode format you'll use on paper before any C++.                        │
│ [ Continue reading ]                                    resume where you left off │
└──────────────────────────────────────────────────────────────────────────────────┘
TODAY
 ☑ Reading path (7 steps · 20 min)          ☐ Running Sum · LEARN
 ☐ Max Consecutive Ones · APPLY              ☐ Move Zeroes · LEARN
 ☐ Remove Duplicates · APPLY                  ☐ Recognition drill · 0/5
 ☐ CS core · OOP · 2 topics · 45 min
 Today's minimum: reading path step 1–3 + Running Sum  ·  streak 0
```
- The **checklist** is compact: one line per item, a status mark, the role/type badge and a time estimate. Clicking an item opens it (it becomes "next up" only if it is the next unfinished one).
- The **full view** (all blocks expanded, as v3 renders now) remains available behind "Show everything" for users who want it; default is focus.
- A small **?** next to "Today's minimum" explains it in two lines.

### 4.2 Next-up order (first unfinished wins)
1. Unfinished **detour stack** (if the user left mid-detour) → "Return to <origin>".
2. Due re-solves (max 2).
3. Yesterday's must-study siblings.
4. Today's **reading path** (resume at the saved step).
5. Carried-over problems (max 4).
6. Today's problems in `ord` order — for a LEARN problem, its **before-reading** comes first (§5.4).
7. Recognition drill.
8. CS core block.
9. Done → **finish screen**.

### 4.3 Finish screen
When every checklist item is done: time spent today (sum of tracked minutes), streak, what was learned (the day's pattern-card lines), tomorrow's title and first reading step, and one button: "Preview tomorrow's reading".

### 4.4 Remove
- The permanent "How this plan works" panel (replaced by onboarding + **?** helpers, §11).

---

## 5. The reader (new core component)

The reader is a full-width reading view used for **all** theory reading: day reading paths, problem before-reading, detours, stuck-ladder links, and direct library browsing.

### 5.1 Anatomy
```
‹ Back to Day 1                                     Reading path · step 3 of 7 · ~3 min
────────────────────────────────────────────────────────────────────────────────────────
WHY THIS STEP  The five-slot pseudocode you write on paper before any C++.
────────────────────────────────────────────────────────────────────────────────────────
Writing pseudocode — the 5-slot format  › The five slots                 [Read | Notes | Revise]
<section body rendered, with ✍️/📸 badges and detour cards inline>
...
┌ DETOUR · 4 min ─────────────────────────────────────────────────────────┐
│ First time finding a bottleneck? This is the method every problem uses. │
│ [ Take detour ]   you'll come back to exactly this line                  │
└─────────────────────────────────────────────────────────────────────────┘
────────────────────────────────────────────────────────────────────────────────────────
[ ✓ Done — next: Big-O § Counting from code ]                         skip this step ›
```
- **Header:** where you came from (back link), the path name, step x of y, minutes.
- **Why-this-step box:** the `bridge` text (path steps) or the reference's `why` (detours, theory-map links, stuck links).
- **Body:** the target section, plus a "Show the rest of this page ▸" link that expands the remaining sections inline (one level).
- **Modes** for the current page: Read (sections) · Notes (§6) · Revise (§7).
- **Primary button:** "Done — next: …" advances the path; on the last step it returns to the origin with a short confirmation.

### 5.2 Detours and the return stack
- A **detour** is an intentional, pre-placed jump to another page/section, authored in content as a line:
  `>> detour <page>#<section> | <why> | <N> min` → renders as the detour card above, **at that exact position**.
- Plain inline links `[[page#section]]` behave the same way (lighter styling, no card).
- Taking a detour **pushes** an entry onto the return stack: `{ origin: route, anchor: blockId, label, scrollY, ts }` and opens the target in the reader with a sticky bar: `↩ Return to: Two Sum › Brainstorm — "4. Optimal (one-pass hash)"`.
- Nested detours are allowed (stack depth ≤ 3; a 4th shows "finish this detour first").
- **Return** (button or Esc) pops the stack, restores the route, scrolls to the anchor and highlights it for 2 s.
- **Anchors:** every rendered block (paragraph, list item, code block, table, detour card, recall item) gets a stable id `<containerId>:<sectionId>:<index>`. The renderer assigns them deterministically from the markdown structure.

### 5.3 Persistence
- `reader` state `{ pathKey, step, stack[], lastAnchorByPage{} }` saved to D1 (`doc` table, key `dsa_reader`) on every change (debounced 1 s) and to `localStorage` as a fallback.
- Today's next-up reads it, so "resume reading" always lands on the exact step and paragraph.
- Each page also remembers the last anchor read (`lastAnchorByPage`), shown in Library as "continue at § …".

### 5.4 Path types
| Path key | Source | Steps |
|---|---|---|
| `day-<n>` | `days/day-NN.json → reading_path` | ordered steps with `bridge`, `minutes` |
| `before-<problemId>` | `theory_refs` with `when = "before"`, in stage order | auto-generated; `why` becomes the bridge |
| `page-<pageId>` | opening a page from Library | the page's sections as steps |
| detour | a detour card / inline link / theory-map row / stuck rung | single step, returns to origin |

- **LEARN problems:** opening the problem shows "Read first (2 steps · 6 min) ▸" as the first step of the problem; finishing it lands on the Understand step.
- **Pending notes** (`notes_status = "pending"`, Days 3–30 for now): the reader still works on section bodies; Notes/Revise modes show "Notes for this page arrive with its day's batch".

---

## 6. Notes

### 6.1 Content
Every page with `notes_status = "ready"` has:
- `note` — markdown outline (rules below),
- `recall` — `[{ q, a }]` (3–7 items),
- `shot` — `{ title, body }` (markdown: table / code / ASCII diagram).
Every Day 1–2 problem has `note` (outline) and every must-study sibling has a short `note` (bullets).

### 6.2 Outline rendering rules (`note` bodies)
- Lines starting `N.` (column 0) → level-1 topic, bold.
- Lines starting with three spaces + `•` → level-2 pointer.
- Lines starting with seven spaces + `◦` → level-3 sub-pointer.
- A line starting `✎` → a write-in prompt: render with a dotted underline field labelled "In my words", not as content to copy.
- Inline markdown (bold, code) as elsewhere.
- Render inside a **note sheet**: title (page title), subject/topic chip, an empty "GoodNotes p.__" box, fixed comfortable width (~680 px), generous line height. Below it the **Recall** box and the **Screenshot card**.

### 6.3 Notes mode (pages and problems)
```
[Read | Notes | Revise]
┌ NOTE SHEET ── Complement lookup · DSA › Hashing ───────────── GoodNotes p.[  ] ┐
│ 1. Idea                                                                        │
│    • For each x, the partner I need is need = target − x                       │
│ ...                                                                            │
│ ✎ In my words: ............................................................... │
└────────────────────────────────────────────────────────────────────────────────┘
RECALL (5)  — write these in the margin of your page; cover the answers to revise
SCREENSHOT CARD  [ Save as image ]
[ ✓ I've written this in GoodNotes ]   page ref: [ nb2 p.14 ]
```
- **"I've written this"** + page ref → stored per page (`dsa_page_note`). Afterwards, any reference to this page shows "already in your notes · nb2 p.14" and the reader's Notes mode shows a small "noted" badge.
- **Problem Notes mode** shows: the problem's own note sheet, then the note sheets of its **must** references (collapsed to titles with "Open note ▸"), then must-sibling short notes once studied.

### 6.4 Screenshot card export
- Render `shot` in a card (title + body) with a fixed width of 1080 px logical size.
- "Save as image": serialise the card DOM into an SVG `<foreignObject>`, draw it to a `<canvas>` at 2× scale, `toBlob('image/png')`, download as `<pageId>-shot.png`. No external libraries.
- Also "Copy image" via `navigator.clipboard.write` when available.

---

## 7. Recall, MCQs and Revise mode

- **Revise mode** (pages and problems): shows only the Recall questions. Each has "Show answer", then self-mark ✓ / ✗.
- ✗ → `dsa_recall` row due in 2 days; ✓ → stage advances (+2, +7, +14 days, then retired); a later ✗ resets to +2. Due recall items appear in **Revision** and as one checklist line on Today ("Recall · 6 due") when any are due.
- **MCQs** (CS core): single answer; on answer show correct/incorrect + `why`; wrong answers create a recall item from the question.
- **Explain prompt** (CS core): a 2-minute text box; "Check with Groq" grades it (clarity, correctness, missing points) using the existing Groq route (`mode: explain_grade`). If GROQ_API_KEY is not set, show "AI check unavailable — compare with the key points below" and list the expected points from the topic notes.

---

## 8. Problem view (guided)

### 8.1 Step bar
```
Two Sum · LEARN · Easy · LC 1 ↗                    ⏱ 0:00  [Start timer]   Stuck?
Read first ● Understand ● Analyse ○ Brainstorm ○ Algorithm ○ Pseudocode ○ Code ○ Notes ○
────────────────────────────────────────────────────────────────────────────────────
HELPER  On paper: what goes in, what comes out, what size is n?
<stage body>                                        Theory for this step (2) ▸
[ Next: Brainstorm ]                                   reveal later steps: role rules
```
- Steps: (Read first, LEARN only) → Understand → Analyse → Brainstorm → Algorithm → Pseudocode → Code (= reference C++ + dry run + edge cases, as one step with three tabs) → Notes (problem note + carry forward + follow-ups) → Done (status + confidence + pseudocode box).
- Role rules from v3 stay: LEARN shows everything; others reveal step by step ("Reveal Analyse" instead of "Next" until revealed).
- Each step shows its **helper line** (§10) and a "Theory for this step (n)" link listing the refs whose `stage` matches.
- **Stuck?** opens a small panel with only the current rung (by elapsed time) and its linked section — opening it is a detour (returns to the step).
- **Done step** contains: status (todo/solved/revisit), confidence 1–5, "My pseudocode" (required for the ✓ to show green; soft gate as v3), and "More ▸" (approach, GoodNotes ref, notes, tags).
- Siblings: after Done, a "Siblings" card (must first). AI panel lives in "More ▸" and in Stuck?.

### 8.2 Theory map (per problem)
A button "Theory map (n)" in the problem header opens a panel:
```
BEFORE YOU START                                                       must
  Complement lookup § Idea
  where: Brainstorm — "Bottleneck: the inner loop searches for one known value"
  why:   The whole idea of this problem in three lines.          [Read ▸]  noted ✓ nb2 p.14
WHILE SOLVING
  ...
IF STUCK
  ...
AFTER (go deeper)                                                      optional
  ...
```
- Grouped by `when`; each row shows page § section, `where` (stage name + the `at` quote), `why` (visible), must/optional badge, noted status.
- "Read ▸" opens it as a detour that returns to the **exact line** quoted in `at`: the renderer searches the stage body for the `at` text (case-insensitive, ignoring markdown symbols); if found, that block is the return anchor and is highlighted; otherwise the stage's first block.
- Inside stage bodies, each reference renders under its stage as a compact row "📘 Complement lookup § Idea — The whole idea … [Read]" (why visible, no tooltip).

---

## 9. Library

- **Index:** two groups — **DSA** (topics in plan order, meta first) and **CS core** (OOP, DBMS, OS, CN, LLD, System design, HLD; pending subjects show their planned topics from `CORE-PLAN.json` as greyed rows). Search across titles, summaries and note text.
- Each page card: title, kind, summary, notes status (ready / pending), noted badge + GoodNotes ref, "continue at § …".
- **Page view:** the reader (§5) in `page-<id>` path mode with Read / Notes / Revise.
- **Used by** per section: rows from `used_by` with where (problem › stage › quote, or day reading path step, or another page), why and when; clicking opens the source with a return to this page.
- **Patterns** sub-view as in v3.

---

## 10. Helper text catalogue

Put all strings in one module (`src/copy.js` or a `COPY` object) keyed as below so they can be tuned without touching logic. Rules: ≤ 15 words, imperative, *what + why*.

| Key | Text |
|---|---|
| today.next.read | "Read this step, then continue — the path remembers where you stop." |
| today.next.resolve | "Solve it again from a blank file. No notes. Then rate yourself." |
| today.next.sibling | "Read the breakdown, write its pseudocode on paper, mark studied." |
| today.next.learn | "New pattern. Read every step first, then code it from a blank file." |
| today.next.apply | "Same idea, new wording. Try it cold; steps stay hidden." |
| today.next.twist | "The idea with one change. Try first; reveal one step at a time." |
| today.next.disguise | "The idea is hidden in a story. Name the pattern before coding." |
| today.next.drill | "Name the pattern and a one-line approach. Don't solve." |
| today.next.core | "Read, write the note, answer recall before revealing." |
| today.next.return | "You left mid-detour. Jump back to where you were." |
| today.minimum | "Do at least this. The day counts and your streak continues." |
| step.read_first | "Two short reads that make this problem make sense. ~6 minutes." |
| step.understand | "Restate it as f(input) → output. Note the constraints." |
| step.analyse | "On paper: what goes in, what comes out, what size is n?" |
| step.brainstorm | "Write the slow solution first. Then name what's wasted." |
| step.algorithm | "3–7 plain sentences. If you can't, the idea isn't ready." |
| step.pseudocode | "Five slots: state, loop, check, update, return. No C++ yet." |
| step.code | "Code it on LeetCode from a blank file. Dry-run if it fails." |
| step.notes | "Copy the outline into GoodNotes. Fill 'In my words' yourself." |
| step.done | "Mark it, rate it honestly, paste your pseudocode." |
| stuck.button | "Stuck? See what to do at this minute." |
| reader.why | "Why this step:" |
| reader.detour | "You'll come back to exactly this line." |
| reader.return | "Return to where you were." |
| notes.sheet | "Write this outline. The ✎ line must be in your own words." |
| notes.recall | "Write these questions in the margin. Cover answers to revise." |
| notes.shot | "Paste this image instead of copying it by hand." |
| notes.noted | "Done writing? Tick it and add the GoodNotes page." |
| revise.item | "Answer from memory, then reveal. Misses come back in 2 days." |
| core.mcq | "Pick one. You'll see why right after." |
| core.explain | "Type it like you'd say it to an interviewer. Two minutes." |
| mock.card | "Unlocks at {time}. Start within 3 hours." |
| finish | "Day done. Tomorrow starts with: {first step}." |

---

## 11. Onboarding

First visit to each surface shows a coachmark sequence (dismissable, "don't show again", re-openable from **?** in the header):
1. Today: "This card is always your next step." → "The list is your whole day." → "Do at least the minimum."
2. Reader: "Why this step." → "Detours come back here." → "Done moves you on."
3. Problem: "Steps go left to right." → "Theory map shows what to read and why." → "Stuck? helps by the minute."
4. Notes mode: "Write this. Fill ✎ yourself. Tick when written."
Store seen flags in `doc` key `dsa_onboarding`.

---

## 12. Content format extension (what the importer must accept)

All files are in `docs/dsa-sheet/v3/` as before. New/changed fields:

| Where | Field | Shape | Notes |
|---|---|---|---|
| `theory/<id>.json` | `note` | markdown outline or null | §6.2 rules |
| | `recall` | `[{q, a}]` | ≥ 3 when present |
| | `shot` | `{title, body}` or null | markdown |
| | `notes_status` | `"ready" \| "pending"` | |
| | `kind` | adds `"core"` | CS core pages live in the same library, topic = subject (`oop`, later `dbms`, `os`, `cn`, `lld`, `sd`, `hld`) |
| | `used_by[]` | rows now carry `kind` (`ref`, `link`, `detour`, `path`, `stuck`, `core`), `why`, `when`, `need`, and origin fields | importer recomputes |
| `theory/INDEX.json` | `pages[].notes_status` | | |
| `days/day-NN.json` | `reading_path` | `[{step, page, section, bridge, minutes}]` | Days 1–2 now; empty → fallback below |
| | `problems[].theory_refs[]` | adds `when` (`before\|while\|stuck\|after`), `need` (`must\|optional`) | v3 rows default to `while`/`optional` |
| | `problems[].note` | outline markdown or null | |
| | `problems[].siblings[].note` | short markdown or null | must-siblings on Days 1–2 |
| | `core` | `{subject, unit, title, minutes, topics[], explain, intro[], mcqs[{id,q,options{a..d},answer,why,topic}]}` | replaces `cs_core` from Day 1–2 on |
| | `cs_core` | legacy card | Days 3–5 still; render as a simple card until replaced |
| any markdown body | detour lines | `>> detour <page>#<section> \| <why> \| <N> min` | §5.2 |
| `CORE-PLAN.json` | new file | `{daily_format[], minimum_for_bad_days, lld_language, days[{day, date, phase, minutes, subject, topics[{title, page}], extra, content}]}` | 30 plan days + 14 intensive days |

**Fallbacks (Days 3–30 until upgraded):** no `reading_path` → build the day path from `micro.theory` (no bridges; minutes 3 each); no `note` → Notes mode shows the v3 ✍️-tagged lines (the current "✍️ only" filter) under a banner "Full outline notes arrive with this day's batch"; `cs_core` → legacy card.

**Importer validation additions** (refuse on failure): detour lines well-formed and resolvable; `reading_path` pages/sections exist; `when`/`need` values valid; `recall` lines parse; a page with any of note/recall/shot has all three; `core.topics` are `kind: core` pages with notes; ≥ 5 MCQs with a valid answer; Days 1–2 problems have notes and LEARN problems have ≥ 1 `before` ref. The authoring tool `authoring/build.py` already enforces all of these; port the same checks to `tools/import-dsa.mjs`.

---

## 13. Data and API

### 13.1 D1 additions (`migrations/0004_dsa_v31.sql`)
```sql
CREATE TABLE IF NOT EXISTS dsa_page_note (          -- "I've written this in GoodNotes"
  page_id TEXT PRIMARY KEY, noted INTEGER NOT NULL DEFAULT 0,
  goodnotes_ref TEXT NOT NULL DEFAULT '', noted_on TEXT, updated_at REAL NOT NULL);

CREATE TABLE IF NOT EXISTS dsa_recall (             -- spaced recall for page / problem / MCQ items
  item_id TEXT PRIMARY KEY,                         -- '<pageId>#r<k>' | 'mcq:<id>'
  source TEXT NOT NULL,                             -- page id or 'core-day-<n>'
  stage INTEGER NOT NULL DEFAULT 0, due_on TEXT, last_result INTEGER,
  updated_at REAL NOT NULL);
CREATE INDEX IF NOT EXISTS dsa_recall_due ON dsa_recall (due_on);

CREATE TABLE IF NOT EXISTS dsa_core_day (           -- CS core progress per plan day
  day INTEGER PRIMARY KEY, topics_done TEXT NOT NULL DEFAULT '[]',
  mcq_score INTEGER, mcq_total INTEGER, explain_text TEXT NOT NULL DEFAULT '',
  explain_feedback TEXT NOT NULL DEFAULT '', done INTEGER NOT NULL DEFAULT 0, updated_at REAL NOT NULL);

CREATE TABLE IF NOT EXISTS dsa_reading (            -- reading path progress
  path_key TEXT PRIMARY KEY, step INTEGER NOT NULL DEFAULT 0, done INTEGER NOT NULL DEFAULT 0,
  updated_at REAL NOT NULL);
```
`doc` keys: `dsa_reader` (return stack + anchors), `dsa_onboarding`, `dsa_ui` (focus/full view, modes).
`dsa_day.micro_read` (v3) becomes "reading path done" for that day.

### 13.2 Routes (Worker)
- `GET/PUT /api/dsa/reader` — the reader doc.
- `PATCH /api/dsa/page-note/:pageId` — noted, goodnotes_ref.
- `GET /api/dsa/recall/due` · `PATCH /api/dsa/recall/:itemId` `{ result: 1|0 }`.
- `PATCH /api/dsa/core-day/:day` — topics_done, mcq answers/score, explain_text.
- `POST /api/dsa/ask` with `mode: "explain_grade"` and `context: { day, prompt, text }` for CS core explanations (reuse the v3 Groq route and its rate guard).
- `PATCH /api/dsa/reading/:pathKey` — step, done.

### 13.3 Notifications
Nudge emails (v3 §11) gain the new item types: "Continue reading: <step>" and "CS core: <topic>". The nudge picks the same next-up as Today (§4.2).

---

## 14. CS core in the app

- **Today:** one checklist line "CS core · <subject> · <n> topics · 45 min". Opening it runs a guided mini-flow:
  1. Intro (the `core.intro` text).
  2. Topic 1 in the reader (`page-<topicId>`, Read mode) → "Write the note" (Notes mode) → Recall (Revise mode, self-mark).
  3. Topic 2, same.
  4. MCQs (one at a time, instant feedback).
  5. Explain (typed, Groq-graded).
  6. Done → `dsa_core_day.done`.
  Minimum for a bad day: topic 1 note + recall.
- **Plan tab:** a "CS core" strip under the DSA grid showing all 30 plan days + the Nov 17–30 intensive from `CORE-PLAN.json`, with subject colours and ready/pending.
- **Library:** CS core group (§9).
- **After Day 30:** Today switches to the intensive: CORE-PLAN `phase: intensive` days (3 h) + daily mock prompt + revision (replaces v3 §8.8 post-plan text).

---

## 15. Phasing

### P1 — for Day 1–2 (ship first; ideally before Day 1 morning)
1. Importer accepts the extended format (§12) with validation.
2. Today focus view + checklist + next-up logic + helper lines (§4, §10); slim shared header; remove the permanent help panel.
3. Reader with day paths, before-paths, detours, return stack, persistence (§5).
4. Problem step bar with helper lines, Theory map, Notes mode with outline rendering, Stuck? panel (§8, §6.1–6.3).
5. CS core flow for Days 1–2 with recall self-marking, MCQs and explain-grading (§14, §7).
6. Library index + page view with modes and Used-by (§9).
7. D1 migration and routes needed by the above.

### P2 — during Days 2–5
Screenshot export (§6.4), onboarding coachmarks (§11), recall scheduling into Revision (§7), finish screen (§4.3), Plan tab CS strip, tab consolidation of Browse into Plan.

**P1 acceptance (fake the clock at 2026-10-18 09:00 IST):**
- Today opens in focus view; next-up is "Reading path · step 1 of 7"; the checklist lists 8 lines (path, 4 problems, drill, CS core, minimum line).
- Continue reading → step 1 shows its bridge; step 7 (Read pointer and write pointer § The idea) contains a detour card to 'Space complexity and "in-place" § What "in-place" means' (2 min); taking it and pressing Return lands back on the same paragraph, highlighted.
- Reload mid-detour → Today's next-up offers "Return to …" and it works.
- Running Sum opens on "Read first (2 steps)"; finishing it lands on Understand; step helper lines match §10; Theory map shows 5 rows grouped Before / While / After with visible why.
- Notes mode on Running Sum renders the outline with levels, the ✎ prompt as a field, and the must refs' note sheets.
- Library → Complement lookup → Notes shows note sheet + 5 recall + screenshot card; tick "written" with "nb1 p.3" → the Two Sum theory map shows "noted ✓ nb1 p.3".
- CS core Day 1: two topics with notes and recall, 6 MCQs with explanations, explain box graded by Groq.
- Day 3 (v3 format) still renders via the fallbacks without errors.

---

## 16. Content status after this delivery

| Item | Status |
|---|---|
| Days 1–2: reading paths, 6-field refs with when/need, detours, problem notes, must-sibling notes, CS core (4 topics, 12 MCQs, 2 explain prompts) | ready |
| Theory notes (note + recall + shot) | 19 DSA pages + 4 CS core pages ready; 142 DSA pages pending (arrive with their days) |
| Days 3–5 | v3 format (fallbacks); upgraded in the next batch together with Days 6–10 |
| `CORE-PLAN.json` | full syllabus for all 7 subjects; content for Days 1–2 only |
