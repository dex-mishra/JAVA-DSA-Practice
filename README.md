# Launch Console

One tracker for two deadlines: IIT KGP placements on **1 December 2026**, and the
deferred MBA application wall in **April 2027**.

Built by merging two earlier single-file trackers — the gamified placement ladder
and the MBA launch-windows page — into a single shell that shares an identity and
a countdown, but deliberately does not share arithmetic.

## The two instruments

They are measured separately and never averaged.

| | Mastery rating | Window integrity |
|---|---|---|
| Range | 800 – 3200, Codeforces ladder | 100% downward only |
| Source | 1,328 rated topics + 145 DSA problems | the 56 dated commitments |
| Moves when | you clear a topic or solve a problem | a date passes unchecked |
| Recovers? | yes, it climbs | **no** |

Folding the MBA items into the rating was the obvious merge and the wrong one.
Ticking *"booked a GMAT slot"* would raise a number that is supposed to mean you
can answer a segment-tree question under pressure. The original placement brief
made this point about its own schedule tab and it holds harder across domains.

Window integrity does not recover because the thing it measures does not. Most
deferred programmes are one shot with no reapplication; a closed door stays
closed, and a score that healed itself would be lying.

The one place the systems meet is the **countdown spine** — the next four open
dated commitments from either domain. They share time, nothing else.

## The DSA plan

A 30-day beginner plan, 2026-10-18 to 2026-11-16: 120 LeetCode problems,
four a day, foundations first (arrays → linear structures → recursion →
trees → graphs → DP). The spec is `docs/dsa-sheet/v3/PRD-v3.md`. Day N is a
calendar date in IST; days never move and nothing in the app can re-plan.

**Today** opens on the day's blocks in a fixed order — due cold re-solves
(+2/+7/+14 days), yesterday's must-study siblings, micro-theory and pattern
card, carried-over problems then today's four, a five-statement recognition
drill, a CS core card — with the first unfinished item already expanded. A
header strip shows the day, the next mock, how far behind you are, the floor
and the streak.

Each problem has a **role** (LEARN, APPLY, TWIST, DISGUISE) and a nine-stage
thinking pipeline (understand → analyse → brainstorm → algorithm →
pseudocode → solution → dry run → edges → carry, plus follow-ups). LEARN
shows every stage; the others start covered and are revealed one at a time.
Every line is tagged ✍️ (write by hand) or 📸 (screenshot); the **✍️ only**
switch shows just what goes on paper. Stages link to exact sections of a
161-page **theory library**, whose pages say which problems use each section.

**Bad days** are handled by rules, not by re-planning: a day is *kept* when
its floor (due re-solves + the first LEARN problem) is met; unfinished
LEARN/APPLY problems are carried over; the cut order queues DISGUISE problems
and downgrades TWISTs to *skimmed*.

**Mocks** are on fixed dates (23 Oct, 28 Oct, 31 Oct, 6 Nov, 9 Nov, 13 Nov,
grand on 16 Nov). At 08:45 IST on the day the Worker draws the unlock time
(09:00–17:00, 15-minute steps) and emails it; from the unlock there are three
hours to start, after which the mock is *missed* and stays available as
unscored practice. On a mock day the DISGUISE problem moves to revision.

**Notifications** come from a Worker cron every 15 minutes (`worker/notify.js`):
nudges at 09/11/13/15/17/19 naming the one next action, the mock email, a
"mock is open" mail, and a 21:00 floor check. Each send is keyed in
`notify_log`, so nothing goes out twice. Needs `RESEND_API_KEY` and `NOTIFY_TO`
as secrets; without them the cron runs and only logs.

**Rating.** A plan problem done is worth 10 topic ticks, *skimmed* 3, a
studied must-sibling 2, out of the full 120 + 120 — so a content batch landing
never moves the number. Re-solves, drill and CS cards are habits and do not
count.

Content arrives as data in `docs/dsa-sheet/v3/` (Days 6–30 in five-day
batches) and is imported, never edited in place:

```bash
npm run import        # validate every cross-reference, report what moved
npm run verify:dsa    # compile and test every reference C++ solution
npm run build
```

The importer refuses on any dangling theory link, wrong stage list, missing
must-sibling, drill count, mock coverage mismatch or misdated mock, and
drops the `verify` fields before anything reaches `public/`. OA mocks with
hidden tests go into the Worker bundle (`worker/oa-content.json`), never
`public/`.

To walk through any date locally: put `DSA_FAKE_CLOCK=1` in `.dev.vars`, run
`npm run dev`, and open `/?clock=2026-10-23T08:50#dsa`. `POST /api/notify/tick`
runs the cron at the page's clock. A deployed Worker ignores the fake clock.

## Layout

```
data/              content only. Safe for an updater to rewrite.
  placement.json     ranks, tracks, badge display text
  mba.json           phases, schools, excluded options
  dsa/               the DSA plan, written by tools/import-dsa.mjs
docs/dsa-sheet/
  v3/                the plan's source: PRD, PLAN.json, days, theory, mocks
  _superseded-v2/    the 145-problem sheet, kept, never read
  _superseded-600-plan/  the abandoned 600-problem version, kept, never read
shared/dsa-core.mjs  IST dates, floor, agenda, mock state -- page and Worker both use it
migrations/        one-off D1 migrations for databases created before a schema change
src/               rendering and logic. Not machine-edited.
  shell.html         page skeleton
  styles.css         unified design system
  app.js             scoring, badge rules, rendering
worker/            the API: progress, MBA overlay, goals, opportunities, OAs,
                   the mock schedule and the notification cron
tools/
  import-dsa.mjs     idempotent DSA import, with an added/changed report
  build.mjs          inlines data/ + src/ into index.html, lays out public/
index.html         the built artifact. Self-contained, opens from disk.
public/            what deploys. Derived; rebuild, never edit.
inbox-agent/       the retired email agent. Nothing deploys it.
```

The split between `data/` and `src/` is the whole point. Content lives in
JSON so it can be updated automatically; the rating maths, badge unlock rules
and layout live in code where an automated edit cannot reach them.

## Build

```bash
node tools/build.mjs
```

Output is a single self-contained `index.html` — no server, no dependencies
beyond Google Fonts, opens straight from disk. Both original briefs asked for
that property and it survives.

The build refuses to emit a file with zero topics, zero MBA items, or a
`data/dsa/` that exists but carries no problems — so a broken data edit fails
loudly instead of shipping a blank tracker.

To re-derive `data/` from the original HTML files:

```bash
node tools/extract.mjs
```

That cross-checks its own output against the counts recorded in the original
build briefs (1,328 rated topics, 56 MBA items) and exits non-zero on drift.

## Storage

Progress lives on the server so it is the same on every device, with
`localStorage` as a cache that makes the first paint instant and keeps the
page usable when the API is unreachable. The server copy wins whenever it is
newer.

Two stores, deliberately separate:

| | Holds | Written |
|---|---|---|
| `doc` | topic ticks, MBA overlay, goals, opportunities, CF cache | whole, a few times a day |
| `dsa_progress` | one row per problem | one problem at a time |

The DSA table is not folded into the tick document because a DSA row carries
notes in markdown, an approach line and a GoodNotes reference. Six hundred of
those in one document would eventually push a placement tick over the size
cap and start failing saves that have nothing to do with DSA — the tracker
would break because you wrote too much about a graph problem.

## Hosting

Cloudflare: static assets for the site and the DSA material, one Worker for
the API, D1 for state. See [DEPLOY.md](DEPLOY.md).

```bash
npm install && npm run deploy
```

It sits inside Cloudflare's free tier permanently rather than against a
credit balance with an expiry date on it — which matters, because Day 1 is
December 2026 and the MBA wall is April 2027.

The DSA content is the reason this is nearly free to serve: 354 static files,
delivered from the edge, with the Worker never running. Only progress needs
compute.

## Still open

Carried over from the original briefs, unresolved:

- **Tuck deferred route** — Tuck's own admissions page lists no deferred pathway
  while third-party guides claim one exists. Tracked as a dated task, not a
  guessed deadline.
- **All April 2027 dates** — projected, not confirmed. Two verification
  checkpoints sit in the timeline as tasks in their own right, on 1 Dec 2026 and
  1 Feb 2027.
- **CGPA** — the system is built on 7.15. The MBA brief carried 8.45; 7.15 was
  confirmed as current, so the MBA positioning was corrected downward rather than
  left flattering.
- **Dual-track split** — 70/30 SDE-to-DS was recommended but never decided. 1,328
  items at 30 minutes each does not fit in the runway; the tracker exists to show
  which sections are lagging, not to imply full completion is realistic.
