Paste everything below the line into Claude Code, opened at the repository root.

---

I am replacing the DSA tab of this tracker with a 30-day beginner plan. All content and the full spec are in `docs/dsa-sheet/v3/`. Do not author or edit content; build the machinery that consumes it.

1. Read `docs/dsa-sheet/v3/PRD-v3.md` end to end, then `docs/dsa-sheet/v3/START-HERE.md`. Then read the current DSA implementation: `tools/import-dsa.mjs`, `tools/build.mjs`, the DSA section of `src/app.js` (from the `DSA sheet` banner comment), `worker/index.js`, `worker/store.js`, `worker/oa.js`, `worker/oa-gen.js` and `schema.sql`.
2. Before writing code, reply with a short plan for **phase v1 only** (PRD §17): which files you will create, change and retire, the D1 migration, and anything in the PRD that conflicts with the code as it is. Ask me about real conflicts; decide small things yourself and list them.
3. After I confirm, implement v1 in this order: move v2 sources to `docs/dsa-sheet/_superseded-v2/` → importer → build → D1 migration + id migration script → Today view and problem panel → theory library with deep links → plan view and header strip → mock schedule/reveal/unlock/window → notifications (cron + Resend) → rating and help text. Commit in small, working steps.
4. Keep the existing conventions: content is imported, never edited in place; `public/` is derived; hidden OA tests and the `verify` fields never reach `public/`; Placement and MBA code paths are untouched.
5. Testing: add the tests in PRD §18, keep `npm run check` green, and add `npm run verify:dsa` running `python3 docs/dsa-sheet/v3/authoring/verify_cpp.py docs/dsa-sheet/v3`.
6. Finish v1 by walking through the acceptance paragraph in PRD §17 (fake the clock where needed) and tell me exactly which secrets/vars I must set (`RESEND_API_KEY`, `NOTIFY_TO`, `CONSOLE_URL`, optional `REPORT_CC`) and the deploy commands.

Day 1 of the plan is 2026-10-18. If v1 cannot be deployed by then, tell me early, and first ship a minimal read-only Today view for Days 1–5 (pipeline + theory links), then continue with the rest of v1.

Do not start v2 or v3 items (PRD §17) until I say so.
