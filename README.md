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
| Source | the 1,328 rated topics | the 56 dated commitments |
| Moves when | you clear a topic | a date passes unchecked |
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

## Layout

```
data/              content only. Safe for an updater to rewrite.
  placement.json     ranks, tracks, badge display text
  mba.json           phases, schools, excluded options
  opportunities.json written by the inbox agent (optional)
src/               rendering and logic. Not machine-edited.
  shell.html         page skeleton
  styles.css         unified design system
  app.js             scoring, badge rules, rendering
tools/
  extract.mjs        one-time migration out of the original HTML files
  build.mjs          inlines data/ + src/ into index.html
index.html         the built artifact. Self-contained, opens from disk.
inbox-agent/       the email agent that feeds data/opportunities.json
```

The split between `data/` and `src/` is the whole point. Content lives in JSON so
it can be updated automatically; the rating maths, badge unlock rules and layout
live in code where an automated edit cannot reach them.

## Build

```bash
node tools/build.mjs
```

Output is a single self-contained `index.html` — no server, no dependencies
beyond Google Fonts, opens straight from disk. Both original briefs asked for
that property and it survives.

The build refuses to emit a file with zero topics or zero MBA items, so a broken
data edit fails loudly instead of shipping a blank tracker.

To re-derive `data/` from the original HTML files:

```bash
node tools/extract.mjs
```

That cross-checks its own output against the counts recorded in the original
build briefs (1,328 rated topics, 56 MBA items) and exits non-zero on drift.

## Storage

Progress is in `localStorage` under `launch-console-v1`.

The originals persisted through `window.storage`, the Claude Artifacts API. That
was correct inside an Artifact and fatal anywhere else: served from GitHub Pages
`window.storage` is undefined, `save()` returned early, and every tick was
discarded on reload with no error. Since the rating derives entirely from checked
state, the page would have read 800 / Newbie permanently.

Both legacy keys (`placement-ladder-v1`, `mba-launch-windows-v1`) are migrated
once on first load, so nothing already ticked is lost.

## Hosting

The workflow in `.github/workflows/pages.yml` builds and deploys on every push to
`main`. It needs Pages switched on once:

**Settings → Pages → Source → GitHub Actions**

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
