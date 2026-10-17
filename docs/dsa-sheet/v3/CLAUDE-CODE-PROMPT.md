Paste everything below the line into Claude Code, opened at the repository root.

---

The DSA tab v3 is live. I now want v3.1: a guided, beginner-friendly redesign of the DSA section, a reader where theory is read as a flow (detours always return to where I was), outline notes for GoodNotes, and a CS core block. The spec is `docs/dsa-sheet/v3/PRD-v3.1-guided.md`; the updated content for Days 1–2 is already in `docs/dsa-sheet/v3/`. Do not author or edit content; build the machinery that consumes it.

1. Read `docs/dsa-sheet/v3/PRD-v3.1-guided.md` end to end, then `docs/dsa-sheet/v3/START-HERE.md`, then skim `PRD-v3.md` for the parts v3.1 builds on. Then read the current DSA code you built for v3 (importer, build, the DSA section of `src/app.js`, Worker routes, migrations).
2. Before writing code, reply with a short plan for **P1 only** (PRD §15): files to create/change/retire, the D1 migration, how you will structure the reader (anchors, return stack, persistence) inside the single-file renderer, and anything in the PRD that conflicts with the code as it is. Ask me about real conflicts; decide small things yourself and list them.
3. After I confirm, implement P1 in this order: importer + validation for the extended format (§12) → D1 migration + routes (§13) → helper text module (§10) → reader with paths, detours, return stack, persistence (§5) → Today focus view + next-up + checklist, slim header, remove the permanent help panel (§4) → problem step bar, theory map, Notes mode with outline rendering, Stuck? panel (§8, §6) → CS core flow with recall, MCQs, explain grading (§14, §7) → Library index and page view with Used-by (§9). Commit in small, working steps.
4. Keep the conventions: content is imported, never edited in place; `public/` is derived; `verify` fields and hidden OA tests never reach `public/`; Placement and MBA code paths are untouched (only the DSA view's copy of the stat tiles is slimmed).
5. Days 3–5 are still in the v3 format. They must keep rendering through the fallbacks in §12 with no errors.
6. Testing: importer tests for every new validation rule; renderer tests for the outline note levels and the ✎ prompt; a test that a detour push → reload → return restores the route and anchor; keep `npm run check` and `npm run verify:dsa` green (expect 80/80).
7. Finish P1 by walking through the P1 acceptance list in §15 with the clock faked to 2026-10-18 09:00 IST, and tell me the deploy commands and whether `GROQ_API_KEY` is needed for anything new.

Day 1 is 2026-10-18. If P1 cannot be deployed by Day 1 morning, ship first, in this order: the importer, the reader with the Day 1 reading path and detour return, and Notes mode for problems. Then the rest of P1.

Commits: ask me for my GitHub credentials (account CeasaKK) before the first commit. Do not add any co-author line to commit messages.

Do not start P2 (§15) until I say so.
