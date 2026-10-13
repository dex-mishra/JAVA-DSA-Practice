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

## The DSA sheet

A section of its own, alongside Placement and MBA — not a fifth placement
track. **145 problems across 30 days**, one per transferable concept. A
problem carries a LeetCode link, a difficulty, a pattern, company tags, a
C++ template and a learnings payload, and you write notes, tags, confidence,
an approach line and a GoodNotes reference against it. None of that is a
checkbox, so none of it was forced into the topics table.

This replaced a 600-problem version that optimised for coverage over
understanding. The surviving rule from it is the one that mattered: problem
ids are `{topic}-{slug}` and stable, so re-keying the phases from `P*` to
`V*` and cutting 495 problems left every progress row intact.

**It does move the rating**, weighted by tier: a CORE problem is worth ten
topic ticks, a DRILL two, a SKIM one. Those track the time each asks for —
SPEC defines CORE as a full solve against an empty file, DRILL as a
variation under ten minutes, SKIM as read-and-move-on, so roughly 45 / 10 /
5 minutes. At the full 145 that puts DSA at 49% of the ladder.
`DSA_WEIGHT` in `src/app.js` is the single constant; set all three to 1 for
flat scoring.

Three decisions worth knowing:

- **The denominator is the 145-problem pool, not the problems imported so
  far.** Four of six phases are in. Using the imported count would drop the
  rating every time a phase landed, purely because the target moved.
- **`revisit` counts the same as `solved`.** It is the status for *I got
  there but I want it again cold*. Scoring it as zero meant that admitting
  shaky recall cost you rating, which trains the wrong reflex — you stop
  marking things honestly. The flag earns its keep by putting the problem in
  the revision queue, not by docking you. The two statuses stay distinct
  everywhere else and are always counted separately.
- **CORE carries no badge.** It is 87% of the sheet, and labelling the
  default is noise. DRILL and SKIM do, because they change what the row asks
  of you.

On the day view **one problem is open at a time** — opening a row closes
whichever was open, and the row you clicked holds its position rather than
jumping as the one above it collapses. Five sets of notes, tags and timers on
screen at once is a wall; one is a next action. The learnings panel inside
always starts closed, including on a row you had it open on, because the
insight is the one thing on the page you can spoil for yourself.

The **pattern index** is the revision surface: 97 pattern names grouped by
topic, each linking to the problem that teaches it and its C++ template.
Read it cold and anything you cannot explain in a sentence is a gap.

Content arrives as JSON in `docs/dsa-sheet/` and is imported, never edited
in place. The importer reads exactly the phase files `SPEC.json` declares, so
the quarantined 600-problem version and the unscheduled optional appendix
sitting beside them cannot be picked up by accident:

```bash
node tools/import-dsa.mjs        # validate, normalise, report what moved
node tools/build.mjs
```

The importer is idempotent — it upserts by problem id and reports
added/changed/unchanged per phase. `--check` validates and writes nothing.
Problem ids are `{topic}-{lc-slug}` and survive a problem moving day or tier,
which is what lets progress key on them. **Re-importing never touches
progress**: content lives in `data/dsa/`, progress lives in its own bucket
blob that the importer cannot reach.

That blob is separate from the tracker's on purpose. `console/progress.json`
is capped at 512 KB because a tick is an id and a boolean; a sheet where
every problem carries free-text notes would eventually push a placement tick
over that cap and start failing saves that had nothing to do with DSA.

The page bakes in a thin index — everything a problem row needs, ~140 KB — and
fetches the learnings, theory and templates per problem from `/api/dsa/*`.
Baking all of it would be a 2 MB parse to show one day's fourteen rows.
Opened from disk with no server the sheet still lists, filters and ticks;
only the teaching material needs the API, and it says so when it is missing.

## Layout

```
data/              content only. Safe for an updater to rewrite.
  placement.json     ranks, tracks, badge display text
  mba.json           phases, schools, excluded options
  dsa/               the DSA sheet, written by tools/import-dsa.mjs
docs/dsa-sheet/    the sheet's source: specs, phase JSON, templates
  _superseded-600-plan/  the abandoned 600-problem version, kept, never read
src/               rendering and logic. Not machine-edited.
  shell.html         page skeleton
  styles.css         unified design system
  app.js             scoring, badge rules, rendering
worker/            the API: progress, MBA overlay, goals, opportunities
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
