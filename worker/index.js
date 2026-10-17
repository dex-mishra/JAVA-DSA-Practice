/**
 * Launch Console — the API, on Cloudflare Workers.
 *
 * Replaces console/main.py, minus the email agent. What that removal takes
 * with it: the OAuth flow, the Gmail secrets, the Cloud Run job, and three
 * of the seven stored documents. What is left is one user's progress across
 * two trackers and a DSA sheet.
 *
 * The DSA *content* is not here at all. It is 350-odd static files under
 * public/data/dsa, served from the edge without this Worker running. Only
 * progress needs code.
 *
 * What this service can and cannot do is still deliberate: it holds no
 * credentials for anything, reaches no third party except Codeforces, and
 * the worst a request can do is change ticks belonging to the person who
 * owns the URL.
 */

import { curriculum, ratedTopics, rankFor } from "./curriculum.js";
import {
  DOC, readDoc, writeDoc, mutateDoc,
  readDsaProgress, patchDsaProgress, DSA_DEFAULTS,
  readDsaLedgers, patchSibling, patchDrill, patchDay, rowToProgress, saveDrillCheck
} from "./store.js";
import { drillItem, checkDrill, AiError } from "./ai.js";
import { istDate, afterResolve } from "../shared/dsa-core.mjs";
import {
  emptyCustom, readCustom, allItems, cleanTags, refusal, sameTag,
  tagFault, DATE_OK, MAX_CUSTOM_MBA, MAX_TAGS_PER_ITEM
} from "./mba.js";
import {
  getMock, allMocks, forList, forAttempt, forReview, gradeProblem, runSamples,
  band, remainingMs, rawRemainingMs, expired, failedPatterns, MAX_SOURCE, GRACE_MIN
} from "./oa.js";
import { runnerStatus, LANGS } from "./runner.js";
import { scheduledMock, mockStatus, allStatuses, attemptKind, linkScoredAttempt } from "./schedule.js";
import { tick } from "./notify.js";

// A tick is an id and a boolean. Tens of thousands still fit well inside
// this; anything larger is a bug or someone poking at the endpoint.
const MAX_PROGRESS_BYTES = 512 * 1024;

const MAX_NOTES = 20_000;
const MAX_APPROACH = 2_000;
const MAX_GOODNOTES = 200;
const MAX_DSA_TAGS = 32;
const MAX_DSA_TAG_LEN = 40;
const STATUSES = new Set(["todo", "solved", "revisit", "skimmed"]);
const CUT_STATES = new Set(["", "skim", "queued"]);
const MAX_PSEUDOCODE = 20_000;
const MAX_GUESS = 1_000;

/* The wall clock for the DSA routes. In local development only, with
   DSA_FAKE_CLOCK=1 in .dev.vars, a request may carry X-DSA-Clock (an ISO
   instant) -- the page sends it when opened with ?clock=..., which is how
   the PRD §17 walk-through runs on any date. Ignored everywhere else, so a
   deployed Worker always uses the real time. */
function clock(env, request) {
  if (env.DSA_FAKE_CLOCK === "1" && request) {
    const t = Date.parse(request.headers.get("x-dsa-clock") || "");
    if (!Number.isNaN(t)) return t;
  }
  return Date.now();
}

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });

const bad = (message, status = 400) => json({ error: message }, status);

// ---------------------------------------------------------------- auth

/* Optional, exactly as the Cloud Run console was: unset means open. The
   difference now is that there is nothing here worth stealing -- no mailbox
   access, no send scope, no third-party credentials. The cost of an open URL
   is someone editing your ticks, not reading your mail. */

async function sessionToken(secret) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("launch-console-session"));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time compare, so a wrong password cannot be narrowed down by
 *  timing how long the rejection took. */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function authorised(request, env) {
  const password = env.CONSOLE_PASSWORD;
  if (!password) return true;

  const supplied = request.headers.get("x-console-password");
  if (supplied && timingSafeEqual(supplied, password)) return true;

  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)lc_session=([a-f0-9]+)/);
  if (match) {
    const expected = await sessionToken(password);
    if (timingSafeEqual(match[1], expected)) return true;
  }
  return false;
}

// ---------------------------------------------------------------- helpers

async function body(request) {
  try {
    const parsed = await request.json();
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

const progressDoc = (db) => readDoc(db, DOC.PROGRESS, {}).then((d) => d.data.data || d.data || {});

// ---------------------------------------------------------------- routes

const routes = [];
const route = (method, pattern, handler) => routes.push({ method, pattern, handler });

// -- session ---------------------------------------------------------------

route("GET", /^\/api\/session$/, async (_m, _r, env) =>
  json({ password_required: !!env.CONSOLE_PASSWORD }));

route("POST", /^\/api\/login$/, async (_m, request, env) => {
  if (!env.CONSOLE_PASSWORD) return json({ ok: true });
  const { password } = await body(request);
  if (typeof password !== "string" || !timingSafeEqual(password, env.CONSOLE_PASSWORD)) {
    return bad("wrong password", 401);
  }
  const token = await sessionToken(env.CONSOLE_PASSWORD);
  return json({ ok: true }, 200, {
    "set-cookie": `lc_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 365}`
  });
});

// -- tracker progress ------------------------------------------------------

route("GET", /^\/api\/progress$/, async (_m, _r, env) => {
  const doc = await readDoc(env.DB, DOC.PROGRESS, {});
  return json({ data: doc.data.data || doc.data || {}, updated_ts: doc.updated_ts });
});

route("PUT", /^\/api\/progress$/, async (_m, request, env) => {
  const payload = await body(request);
  const data = payload.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return bad("expected an object under 'data'");
  }
  if (new TextEncoder().encode(JSON.stringify(data)).length > MAX_PROGRESS_BYTES) {
    return bad("progress payload too large", 413);
  }
  const ts = await writeDoc(env.DB, DOC.PROGRESS, { version: 1, data });
  return json({ updated_ts: ts });
});

// -- topics (MCP) ----------------------------------------------------------

route("GET", /^\/api\/topics$/, async (_m, request, env) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";
  const track = url.searchParams.get("track") || "";
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 100), 1000));

  const data = await progressDoc(env.DB);
  const checked = data.checked || {};

  const rows = [];
  for (const t of curriculum().topics) {
    const done = !!checked[t.id];
    if (status === "done" && !done) continue;
    if (status === "todo" && done) continue;
    if (track && t.track !== track) continue;
    if (query && !t.label.toLowerCase().includes(query) && !t.section.toLowerCase().includes(query)) continue;
    rows.push({ ...t, done });
  }
  return json({ total: rows.length, topics: rows.slice(0, limit) });
});

route("POST", /^\/api\/topics\/set$/, async (_m, request, env) => {
  const { ids, done = true } = await body(request);
  if (!Array.isArray(ids) || !ids.length) return bad("give at least one topic id");

  const known = new Set(curriculum().topics.map((t) => t.id));
  const unknown = ids.filter((id) => !known.has(id));
  if (unknown.length) return bad(`unknown topic ids: ${unknown.slice(0, 5).join(", ")}`);

  const next = await mutateDoc(env.DB, DOC.PROGRESS, {}, (doc) => {
    const state = doc.data || (doc.data = {});
    const checked = state.checked || (state.checked = {});
    for (const id of ids) {
      if (done) checked[id] = 1;
      else delete checked[id];
    }
    return { ...doc, version: 1 };
  });

  const checked = (next.data || {}).checked || {};
  const rated = ratedTopics();
  const doneCount = rated.filter((t) => checked[t.id]).length;
  return json({ changed: ids.length, done, mastery: mastery(doneCount, rated.length) });
});

function mastery(done, total) {
  const pct = total ? (done / total) * 100 : 0;
  const rating = Math.round(800 + (pct / 100) * 2400);
  return { rating, rank: rankFor(rating).n, done, total, percent: Math.round(pct * 10) / 10 };
}

// -- MBA -------------------------------------------------------------------

const loadCustom = async (db) => readCustom((await readDoc(db, DOC.MBA_CUSTOM, emptyCustom())).data);

route("GET", /^\/api\/mba$/, async (_m, _r, env) => {
  const data = await progressDoc(env.DB);
  const checked = data.mba || {};
  const custom = await loadCustom(env.DB);
  const items = allItems(custom).map((i) => ({
    id: i.id, task: i.task, date: i.date || "", phase: i.phase,
    tags: i.tags || [], excluded: !!i.excluded,
    source: i.source || "curriculum", overridden: !!i.overridden,
    done: !!checked[i.id]
  }));
  return json({ total: items.length, items });
});

/* Just the delta from the baked-in list. What the site fetches to splice
   onto the static data it already shipped with, so a change shows up where
   a person actually looks rather than only where an assistant does. */
route("GET", /^\/api\/mba\/custom$/, async (_m, _r, env) => json(await loadCustom(env.DB)));

route("POST", /^\/api\/mba\/set$/, async (_m, request, env) => {
  const { id, done = true } = await body(request);
  const custom = await loadCustom(env.DB);
  if (!allItems(custom).some((i) => i.id === id)) return bad(`unknown MBA item '${id}'`);

  await mutateDoc(env.DB, DOC.PROGRESS, {}, (doc) => {
    const state = doc.data || (doc.data = {});
    const mba = state.mba || (state.mba = {});
    if (done) mba[id] = 1;
    else delete mba[id];
    return { ...doc, version: 1 };
  });
  return json({ id, done: !!done });
});

route("POST", /^\/api\/mba\/create$/, async (_m, request, env) => {
  const payload = await body(request);
  const task = String(payload.task || "").trim().slice(0, 300);
  if (!task) return bad("task is required");

  const date = String(payload.date || "").trim();
  if (date && !DATE_OK.test(date)) return bad("date must be YYYY-MM-DD");

  const { kept, rejected } = cleanTags(payload.tags || []);
  if ((payload.tags || []).length && !kept.length) return bad(refusal(rejected));

  let created = null;
  await mutateDoc(env.DB, DOC.MBA_CUSTOM, emptyCustom(), (doc) => {
    const custom = readCustom(doc);
    if (custom.items.length >= MAX_CUSTOM_MBA) throw new Error(`at most ${MAX_CUSTOM_MBA} custom MBA items`);
    const id = `c${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
    created = {
      id, task, date, note: String(payload.note || "").slice(0, 600),
      phase: String(payload.phase || "CUSTOM").slice(0, 40) || "CUSTOM",
      tags: kept
    };
    custom.items.push(created);
    return custom;
  });

  return json({ item: created, rejected });
});

route("POST", /^\/api\/mba\/tags$/, async (_m, request, env) => {
  const { id, tags: raw } = await body(request);
  const custom = await loadCustom(env.DB);
  const item = allItems(custom).find((i) => i.id === id);
  if (!item) return bad(`unknown MBA item '${id}'`);

  const { kept, rejected } = cleanTags(raw || []);
  if (!kept.length) return bad(refusal(rejected));

  const next = await mutateDoc(env.DB, DOC.MBA_CUSTOM, emptyCustom(), (doc) => {
    const c = readCustom(doc);
    const add = c.tag_add[id] || (c.tag_add[id] = []);
    for (const tag of kept) {
      // Adding undoes a stale removal of the same tag, so a toggle behaves
      // the way it looks like it should.
      if (c.tag_removed[id]) c.tag_removed[id] = c.tag_removed[id].filter((t) => !sameTag(t, tag));
      const onItem = (item.tags || []).some((t) => sameTag(t, tag));
      if (!onItem && !add.some((t) => sameTag(t, tag))) add.push(tag);
    }
    if (!c.tag_add[id].length) delete c.tag_add[id];
    if (c.tag_removed[id] && !c.tag_removed[id].length) delete c.tag_removed[id];
    return c;
  });

  const after = allItems(readCustom(next)).find((i) => i.id === id);
  return json({ id, tags: after ? after.tags : [], rejected });
});

route("POST", /^\/api\/mba\/tags\/remove$/, async (_m, request, env) => {
  const { id, tags: raw } = await body(request);
  const custom = await loadCustom(env.DB);
  const item = allItems(custom).find((i) => i.id === id);
  if (!item) return bad(`unknown MBA item '${id}'`);

  const wanted = (Array.isArray(raw) ? raw : []).map((t) => String(t).trim()).filter(Boolean);
  if (!wanted.length) return bad(refusal([], "remove"));

  const next = await mutateDoc(env.DB, DOC.MBA_CUSTOM, emptyCustom(), (doc) => {
    const c = readCustom(doc);
    for (const tag of wanted) {
      if (c.tag_add[id]) c.tag_add[id] = c.tag_add[id].filter((t) => !sameTag(t, tag));
      // A curriculum item's own tag cannot be edited out of data/mba.json,
      // so it is suppressed at read time instead.
      const onCustom = c.items.find((i) => i.id === id);
      if (onCustom) onCustom.tags = (onCustom.tags || []).filter((t) => !sameTag(t, tag));
      const baked = (item.tags || []).some((t) => sameTag(t, tag));
      if (baked) {
        const rm = c.tag_removed[id] || (c.tag_removed[id] = []);
        if (!rm.some((t) => sameTag(t, tag))) rm.push(tag);
      }
      if (c.tag_add[id] && !c.tag_add[id].length) delete c.tag_add[id];
    }
    return c;
  });

  const after = allItems(readCustom(next)).find((i) => i.id === id);
  return json({ id, tags: after ? after.tags : [] });
});

route("POST", /^\/api\/mba\/exclude$/, async (_m, request, env) => {
  const { id, excluded = true } = await body(request);
  const custom = await loadCustom(env.DB);
  if (!allItems(custom).some((i) => i.id === id)) return bad(`unknown MBA item '${id}'`);

  await mutateDoc(env.DB, DOC.MBA_CUSTOM, emptyCustom(), (doc) => {
    const c = readCustom(doc);
    c.exclude_over[id] = !!excluded;
    return c;
  });
  return json({ id, excluded: !!excluded });
});

route("POST", /^\/api\/mba\/delete$/, async (_m, request, env) => {
  const { id } = await body(request);
  const custom = await loadCustom(env.DB);
  const item = allItems(custom).find((i) => i.id === id);
  if (!item) return bad(`unknown MBA item '${id}'`);

  const wasCustom = item.source === "custom";
  await mutateDoc(env.DB, DOC.MBA_CUSTOM, emptyCustom(), (doc) => {
    const c = readCustom(doc);
    if (wasCustom) {
      c.items = c.items.filter((i) => i.id !== id);
      delete c.tag_add[id];
      delete c.tag_removed[id];
      delete c.exclude_over[id];
    } else {
      // A curriculum item ships with the site and returns on the next
      // deploy, so deleting it is not on offer. Hiding it into EXCLUDED is,
      // reversibly, which is where the "decided against" schools live.
      c.exclude_over[id] = true;
    }
    return c;
  });
  return json({ id, deleted: wasCustom, excluded: !wasCustom });
});

// -- goals -----------------------------------------------------------------

route("GET", /^\/api\/goals$/, async (_m, request, env) => {
  const wanted = new URL(request.url).searchParams.get("status") || "";
  const doc = await readDoc(env.DB, DOC.GOALS, { goals: [] });
  let goals = Array.isArray(doc.data.goals) ? doc.data.goals : [];
  if (wanted) goals = goals.filter((g) => (g.status || "open") === wanted);
  return json({ total: goals.length, goals });
});

route("POST", /^\/api\/goals$/, async (_m, request, env) => {
  const payload = await body(request);
  const title = String(payload.title || "").trim().slice(0, 200);
  if (!title) return bad("title is required");
  const due = String(payload.due || "").trim();
  if (due && !DATE_OK.test(due)) return bad("due must be YYYY-MM-DD");

  let created = null;
  await mutateDoc(env.DB, DOC.GOALS, { goals: [] }, (doc) => {
    const goals = Array.isArray(doc.goals) ? doc.goals : [];
    created = {
      id: `g${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
      title, detail: String(payload.detail || "").slice(0, 2000),
      due, status: "open", created: new Date().toISOString().slice(0, 10)
    };
    goals.push(created);
    return { goals };
  });
  return json({ goal: created });
});

route("PATCH", /^\/api\/goals\/([^/]+)$/, async (match, request, env) => {
  const id = decodeURIComponent(match[1]);
  const payload = await body(request);
  let updated = null;

  await mutateDoc(env.DB, DOC.GOALS, { goals: [] }, (doc) => {
    const goals = Array.isArray(doc.goals) ? doc.goals : [];
    const goal = goals.find((g) => g.id === id);
    if (goal) {
      for (const field of ["title", "detail", "due", "status"]) {
        if (payload[field] !== undefined) goal[field] = String(payload[field]);
      }
      updated = goal;
    }
    return { goals };
  });

  if (!updated) return bad(`unknown goal '${id}'`, 404);
  return json({ goal: updated });
});

route("DELETE", /^\/api\/goals\/([^/]+)$/, async (match, _r, env) => {
  const id = decodeURIComponent(match[1]);
  let found = false;
  await mutateDoc(env.DB, DOC.GOALS, { goals: [] }, (doc) => {
    const goals = Array.isArray(doc.goals) ? doc.goals : [];
    found = goals.some((g) => g.id === id);
    return { goals: goals.filter((g) => g.id !== id) };
  });
  if (!found) return bad(`unknown goal '${id}'`, 404);
  return json({ id, deleted: true });
});

// -- overview (MCP) --------------------------------------------------------

route("GET", /^\/api\/overview$/, async (_m, _r, env) => {
  const data = await progressDoc(env.DB);
  const checked = data.checked || {};
  const rated = ratedTopics();
  const doneCount = rated.filter((t) => checked[t.id]).length;

  const custom = await loadCustom(env.DB);
  const mbaChecked = data.mba || {};
  const items = allItems(custom);
  const dated = items.filter((i) => i.date && !i.excluded);
  const today = new Date().toISOString().slice(0, 10);
  const missed = dated.filter((i) => i.date < today && !mbaChecked[i.id]).length;

  const dsa = await readDsaProgress(env.DB);
  // Both non-todo statuses count as attempted: a problem marked revisit was
  // still solved, the flag only says you want it again cold.
  const rows = Object.values(dsa.problems);
  const solved = rows.filter((p) => p.status === "solved").length;
  const revisit = rows.filter((p) => p.status === "revisit").length;

  return json({
    mastery: mastery(doneCount, rated.length),
    mba: {
      total: items.length,
      done: items.filter((i) => mbaChecked[i.id]).length,
      dated: dated.length,
      missed,
      window_integrity: dated.length ? Math.round(((dated.length - missed) / dated.length) * 1000) / 10 : 100
    },
    dsa: { done: solved + revisit, solved, revisit, touched: rows.length },
    days_to_day_one: Math.round((new Date("2026-12-01") - new Date(today)) / 86400000)
  });
});

// -- DSA progress ----------------------------------------------------------

/* One read for everything the DSA tab writes: problem rows plus the v3
   ledgers (siblings, drill, per-day). The page boots from this in one round
   trip instead of four. */
route("GET", /^\/api\/dsa\/progress$/, async (_m, request, env) => {
  const [progress, ledgers] = await Promise.all([readDsaProgress(env.DB), readDsaLedgers(env.DB)]);
  return json({ ...progress, ...ledgers, today: istDate(clock(env, request)), ai: !!env.GROQ_API_KEY });
});

route("PATCH", /^\/api\/dsa\/progress\/([^/]+)$/, async (match, request, env) => {
  const id = decodeURIComponent(match[1]);
  const payload = await body(request);
  const patch = {};

  if ("status" in payload) {
    if (!STATUSES.has(payload.status)) return bad("status must be one of todo, solved, revisit, skimmed");
    patch.status = payload.status;
  }
  if ("my_pseudocode" in payload) patch.my_pseudocode = String(payload.my_pseudocode).slice(0, MAX_PSEUDOCODE);
  if ("minutes_spent" in payload) {
    const v = payload.minutes_spent;
    if (v === null || v === "") patch.minutes_spent = null;
    else {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n > 24 * 60) return bad("minutes_spent must be whole minutes, 0 to 1440");
      patch.minutes_spent = n;
    }
  }
  if ("cut_state" in payload) {
    if (!CUT_STATES.has(payload.cut_state)) return bad("cut_state must be '', skim or queued");
    patch.cut_state = payload.cut_state;
  }
  if ("next_resolve_on" in payload) {
    const v = payload.next_resolve_on;
    if (v === null || v === "") patch.next_resolve_on = null;
    else if (typeof v === "string" && DATE_OK.test(v)) patch.next_resolve_on = v;
    else return bad("next_resolve_on must be YYYY-MM-DD or null");
  }
  if ("revision" in payload) patch.revision = !!payload.revision;
  if ("notes" in payload) patch.notes = String(payload.notes).slice(0, MAX_NOTES);
  if ("my_approach" in payload) patch.my_approach = String(payload.my_approach).slice(0, MAX_APPROACH);
  // Opaque by contract: trimmed and length-capped, never parsed.
  if ("goodnotes_ref" in payload) patch.goodnotes_ref = String(payload.goodnotes_ref).trim().slice(0, MAX_GOODNOTES);

  if ("tags" in payload) {
    if (!Array.isArray(payload.tags)) return bad("tags must be an array");
    const seen = new Set();
    const tags = [];
    for (const t of payload.tags) {
      const s = String(t).trim().toLowerCase().slice(0, MAX_DSA_TAG_LEN);
      if (s && !seen.has(s)) { seen.add(s); tags.push(s); }
    }
    patch.tags = tags.slice(0, MAX_DSA_TAGS);
  }

  if ("confidence" in payload) {
    const v = payload.confidence;
    if (v === null || v === "") patch.confidence = null;
    else {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 5) return bad("confidence must be between 1 and 5");
      patch.confidence = n;
    }
  }

  if ("last_revised" in payload) {
    const v = payload.last_revised;
    if (v === null || v === "") patch.last_revised = null;
    else if (typeof v === "string" && DATE_OK.test(v)) patch.last_revised = v;
    else return bad("last_revised must be YYYY-MM-DD or null");
  }

  if (!Object.keys(patch).length) return bad("nothing to update");

  const row = await patchDsaProgress(env.DB, id, patch, { now: clock(env, request) });
  return json({ id, progress: row });
});

/* A cold re-solve (PRD §8.2): advances the +2/+7/+14 ladder, or brings it
   back in two days when it went badly. Its own route rather than a field on
   PATCH because the next date depends on the stored row, and the server is
   the only place that sees the stored row and today's IST date together. */
route("POST", /^\/api\/dsa\/resolve\/([^/]+)$/, async (match, request, env) => {
  const id = decodeURIComponent(match[1]);
  const payload = await body(request);
  const n = Number(payload.confidence);
  if (!Number.isInteger(n) || n < 1 || n > 5) return bad("confidence must be between 1 and 5");

  const row = rowToProgress(await env.DB.prepare("SELECT * FROM dsa_progress WHERE problem_id = ?").bind(id).first());
  if (!row.first_done_at) return bad("this problem has not been solved yet, so there is nothing to re-solve", 409);
  if (!row.next_resolve_on) return bad("every re-solve for this problem is already done", 409);

  const now = clock(env, request);
  const today = istDate(now);
  const progress = await patchDsaProgress(env.DB, id, {
    ...afterResolve(row, n, today), confidence: n, last_revised: today
  }, { now });
  return json({ id, progress });
});

route("PATCH", /^\/api\/dsa\/sibling\/([^/]+)$/, async (match, request, env) => {
  const id = decodeURIComponent(match[1]);
  const payload = await body(request);
  const patch = {};
  if ("parent_id" in payload) patch.parent_id = String(payload.parent_id).slice(0, 120);
  if ("studied" in payload) patch.studied = !!payload.studied;
  if ("solved" in payload) patch.solved = !!payload.solved;
  if ("notes" in payload) patch.notes = String(payload.notes).slice(0, MAX_NOTES);
  if (!Object.keys(patch).length) return bad("nothing to update");
  try {
    return json({ id, sibling: await patchSibling(env.DB, id, patch, { now: clock(env, request) }) });
  } catch (e) {
    return bad(e.message);
  }
});

route("PATCH", /^\/api\/dsa\/drill\/([^/]+)$/, async (match, request, env) => {
  const id = decodeURIComponent(match[1]);
  const payload = await body(request);
  const patch = {};
  if ("day" in payload) {
    const n = Number(payload.day);
    if (!Number.isInteger(n) || n < 1 || n > 30) return bad("day must be 1..30");
    patch.day = n;
  }
  if ("guess" in payload) patch.guess = String(payload.guess).slice(0, MAX_GUESS);
  if ("correct" in payload) patch.correct = payload.correct === null ? null : !!payload.correct;
  if (!Object.keys(patch).length) return bad("nothing to update");
  try {
    return json({ id, drill: await patchDrill(env.DB, id, patch, { now: clock(env, request) }) });
  } catch (e) {
    return bad(e.message);
  }
});

/* Groq checks a drill answer against the reference (worker/ai.js). The
   answer key never goes to the model's output -- it judges, it does not
   explain the solution. 503 when no key is configured, 429 when the
   free-tier guard says wait; the page falls back to reveal + self-mark. */
route("POST", /^\/api\/dsa\/drill\/([^/]+)\/check$/, async (match, request, env) => {
  const id = decodeURIComponent(match[1]);
  const item = drillItem(id);
  if (!item) return bad("unknown drill item", 404);
  const payload = await body(request);
  const guess = String(payload.guess || "").trim().slice(0, MAX_GUESS);
  if (guess.length < 3) return bad("write the pattern and a one-line approach first");
  const now = clock(env, request);
  try {
    const check = await checkDrill(env, item, guess);
    const drill = await saveDrillCheck(env.DB, id, item.day, guess, check, { now });
    return json({ id, drill, check });
  } catch (e) {
    if (!(e instanceof AiError)) throw e;
    const status = e.kind === "config" ? 503 : e.kind === "rate" ? 429 : 502;
    return json({ error: e.message, kind: e.kind, retry_after: e.retryAfter }, status);
  }
});

route("PATCH", /^\/api\/dsa\/day\/(\d+)$/, async (match, request, env) => {
  const day = Number(match[1]);
  if (day < 1 || day > 30) return bad("day must be 1..30");
  const payload = await body(request);
  const patch = {};
  for (const k of ["kept", "micro_read", "cs_core_done"]) if (k in payload) patch[k] = !!payload[k];
  if ("note" in payload) patch.note = String(payload.note).slice(0, MAX_NOTES);
  if (!Object.keys(patch).length) return bad("nothing to update");
  return json({ day, ledger: await patchDay(env.DB, day, patch, { now: clock(env, request) }) });
});

// -- opportunities ---------------------------------------------------------

/* The email agent used to write these. With the agent retired the tab keeps
   its place and becomes yours to fill: a posting you spot on a noticeboard
   or in a WhatsApp group goes in here the same way a deadline goes into the
   MBA tab. */

route("GET", /^\/api\/opportunities$/, async (_m, _r, env) => {
  const doc = await readDoc(env.DB, DOC.OPPORTUNITIES, { opportunities: [] });
  const items = Array.isArray(doc.data.opportunities) ? doc.data.opportunities : [];
  return json({ opportunities: items });
});

/* The stored shape is the agent's, unchanged. The tab already renders
   company / role / deadline / summary / apply_url, and anything the agent
   left behind must keep rendering beside what you add by hand -- so the
   manual path fills the same fields rather than inventing a second shape
   the renderer would have to special-case. */
route("POST", /^\/api\/opportunities$/, async (_m, request, env) => {
  const payload = await body(request);
  const company = String(payload.company || "").trim().slice(0, 120);
  const role = String(payload.role || "").trim().slice(0, 160);
  if (!company && !role) return bad("give at least a company or a role");

  const deadline = String(payload.deadline || "").trim();
  if (deadline && !DATE_OK.test(deadline)) return bad("deadline must be YYYY-MM-DD");

  const url = String(payload.apply_url || "").trim().slice(0, 500);
  if (url && !/^https?:\/\//i.test(url)) return bad("the apply link must start with http:// or https://");

  let created = null;
  await mutateDoc(env.DB, DOC.OPPORTUNITIES, { opportunities: [] }, (doc) => {
    const list = Array.isArray(doc.opportunities) ? doc.opportunities : [];
    created = {
      id: `o${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
      company, role, deadline,
      apply_url: url,
      summary: String(payload.summary || "").slice(0, 600),
      location: String(payload.location || "").trim().slice(0, 80),
      stipend: String(payload.stipend || "").trim().slice(0, 80),
      added: new Date().toISOString().slice(0, 10),
      // Marks it as yours rather than the agent's, which is what lets the
      // tab offer a delete button on it and not on the archived ones.
      origin: "manual"
    };
    list.unshift(created);
    return { opportunities: list };
  });
  return json({ opportunity: created });
});

route("DELETE", /^\/api\/opportunities\/([^/]+)$/, async (match, _r, env) => {
  const id = decodeURIComponent(match[1]);
  let found = false;
  await mutateDoc(env.DB, DOC.OPPORTUNITIES, { opportunities: [] }, (doc) => {
    const list = Array.isArray(doc.opportunities) ? doc.opportunities : [];
    found = list.some((o) => o.id === id);
    return { opportunities: list.filter((o) => o.id !== id) };
  });
  if (!found) return bad(`unknown opportunity '${id}'`, 404);
  return json({ id, deleted: true });
});

// -- codeforces ------------------------------------------------------------

/* Proxied rather than fetched from the browser, for the same two reasons as
   before: the response is cached so a reload does not re-ask, and the handle
   lives server-side so the page works the same on every device. */

const CF_TTL = 3600;

route("GET", /^\/api\/codeforces$/, async (_m, request, env) => {
  const url = new URL(request.url);
  const setHandle = url.searchParams.get("handle");

  const cached = await readDoc(env.DB, DOC.CODEFORCES, {});
  let handle = cached.data.handle || env.CF_HANDLE || "";

  if (setHandle !== null) {
    handle = String(setHandle).trim().slice(0, 40);
    await writeDoc(env.DB, DOC.CODEFORCES, { handle, fetched: 0 });
    if (!handle) return json({ cf_handle: "", cleared: true });
  }

  if (!handle) return json({ error: "no handle set", cf_handle: "" });

  const age = Date.now() / 1000 - (cached.data.fetched || 0);
  if (cached.data.payload && cached.data.handle === handle && age < CF_TTL) {
    return json({ ...cached.data.payload, cf_handle: handle, cached: true });
  }

  try {
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`, {
      headers: { "user-agent": "launch-console" }
    });
    const data = await res.json();
    if (data.status !== "OK" || !data.result || !data.result.length) {
      return json({ error: `Codeforces did not recognise '${handle}'`, cf_handle: handle });
    }
    const u = data.result[0];
    const payload = {
      handle: u.handle,
      rating: u.rating ?? null,
      rank: u.rank || "unrated",
      max_rating: u.maxRating ?? null,
      max_rank: u.maxRank || ""
    };
    await writeDoc(env.DB, DOC.CODEFORCES, { handle, fetched: Date.now() / 1000, payload });
    return json({ ...payload, cf_handle: handle });
  } catch (err) {
    // Stale beats empty: a Codeforces outage should not blank the tiles.
    if (cached.data.payload) return json({ ...cached.data.payload, cf_handle: handle, stale: true });
    return json({ error: "could not reach Codeforces", cf_handle: handle });
  }
});

// -- OA mocks --------------------------------------------------------------

/* The assessment tab. Three things make it different from everything else
   under /api:
   - the content is bundled into this Worker rather than served as a static
     asset, because hidden tests must not be readable before submission;
   - the clock is the server's, because a client timer is paused by closing
     a laptop and the pressure is the point;
   - a submitted problem locks, because being able to resubmit turns a
     diagnostic into a debugger. */

const LANG_IDS = new Set(LANGS.map((l) => l.id));

async function readAttempt(db, id) {
  const row = await db.prepare("SELECT * FROM oa_attempt WHERE id = ?").bind(id).first();
  if (!row) return null;
  let per = {};
  try {
    const parsed = JSON.parse(row.per_problem || "{}");
    if (parsed && typeof parsed === "object") per = parsed;
  } catch { /* a malformed blob is an empty one, not a 500 */ }
  return { ...row, per_problem: per };
}

async function saveAttempt(db, id, per) {
  await db.prepare("UPDATE oa_attempt SET per_problem = ? WHERE id = ?")
    .bind(JSON.stringify(per), id).run();
}

/** Shared by every per-attempt route: find it, find its mock, and refuse
 *  the ones that cannot be acted on. */
async function openAttempt(env, rawId, { mustBeLive = true } = {}) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return { error: bad("not an attempt id", 400) };

  const attempt = await readAttempt(env.DB, id);
  if (!attempt) return { error: bad(`no attempt ${id}`, 404) };

  const mock = getMock(attempt.mock_id);
  if (!mock) return { error: bad(`attempt ${id} refers to '${attempt.mock_id}', which is no longer a mock`, 410) };

  if (mustBeLive && attempt.ended_at) return { error: bad("this attempt has finished", 409) };
  return { attempt, mock, id };
}

/* The prerequisite rule from PRD §2, as a soft gate.
   Why soft: the rule exists so a mock is never a test of material you have
   not studied, and the only evidence available here is what has been ticked
   in this tracker. Days done on paper and never ticked are common enough
   that a hard block would mostly be wrong, so the unmet days are reported
   and the choice is left to the person who actually knows. */
async function prerequisites(db, mock) {
  const { results } = await db
    .prepare("SELECT problem_id FROM dsa_progress WHERE status IN ('solved', 'revisit')")
    .all();
  const done = new Set((results || []).map((r) => r.problem_id));
  return { solved_count: done.size, covers_days: mock.covers_days };
}

route("GET", /^\/api\/oa\/mocks$/, async (_m, request, env) => {
  const now = clock(env, request);
  const progress = (await readDsaProgress(env.DB)).problems;
  const mocks = [];
  for (const mock of allMocks()) {
    const sched = scheduledMock(mock.id);
    mocks.push({
      ...forList(mock),
      prerequisites: await prerequisites(env.DB, mock),
      schedule: sched ? await mockStatus(env.DB, sched, now, { progress }) : null
    });
  }

  const { results } = await env.DB
    .prepare("SELECT id, mock_id, started_at FROM oa_attempt WHERE ended_at IS NULL ORDER BY started_at DESC")
    .all();

  /* An unfinished attempt whose clock has run out is not resumable, it is
     just unfinished. Reporting it as live would offer a Resume button that
     opens an assessment with zero seconds on it. */
  const live = (results || [])
    .map((r) => ({ id: r.id, mock_id: r.mock_id, started_at: r.started_at }))
    .filter((r) => {
      const mock = getMock(r.mock_id);
      return mock && !expired(r, mock);
    });

  return json({
    mocks, in_progress: live, runner: runnerStatus(env), langs: LANGS,
    // Every scheduled mock, including those whose content has not landed.
    schedule: await allStatuses(env.DB, now, { progress }),
    now
  });
});

/* The schedule alone, for the header countdown: cheap enough to poll. */
route("GET", /^\/api\/oa\/schedule$/, async (_m, request, env) => {
  const now = clock(env, request);
  const progress = (await readDsaProgress(env.DB)).problems;
  return json({ schedule: await allStatuses(env.DB, now, { progress }), now });
});

route("POST", /^\/api\/oa\/attempt$/, async (_m, request, env) => {
  const payload = await body(request);
  const mock = getMock(String(payload.mock_id || ""));
  if (!mock) return bad("unknown mock", 404);

  /* One live attempt at a time. Two open assessments on the same mock means
     two clocks and two sets of drafts, and whichever is submitted second
     silently wins. */
  const open = await env.DB
    .prepare("SELECT id, mock_id, started_at FROM oa_attempt WHERE ended_at IS NULL")
    .all();
  for (const row of open.results || []) {
    const other = getMock(row.mock_id);
    if (other && !expired(row, other)) {
      return json({ error: "an attempt is already in progress", attempt_id: row.id }, 409);
    }
  }

  /* The schedule decides what kind of attempt this is (PRD §10): scored
     inside the 3-hour window, practice after it or after the scored one,
     refused before the unlock. The timer itself stays on the real clock --
     a faked clock is for walking through dates, not for grading. */
  const now = clock(env, request);
  const sched = scheduledMock(mock.id);
  const status = sched ? await mockStatus(env.DB, sched, now) : null;
  const kind = attemptKind(status);
  if (kind.error) return json({ error: kind.error, schedule: status }, 423);

  const started = Date.now() / 1000;
  const res = await env.DB
    .prepare("INSERT INTO oa_attempt (mock_id, started_at, per_problem, kind) VALUES (?, ?, '{}', ?)")
    .bind(mock.id, started, kind.kind).run();

  const id = res.meta.last_row_id;
  if (kind.kind === "scored") await linkScoredAttempt(env.DB, mock.id, id, now);
  return json({
    attempt_id: id,
    kind: kind.kind,
    started_at: started,
    remaining_ms: remainingMs({ started_at: started }, mock),
    mock: forAttempt(mock)
  });
});

route("GET", /^\/api\/oa\/attempt\/(\d+)$/, async (match, _r, env) => {
  const found = await openAttempt(env, match[1], { mustBeLive: false });
  if (found.error) return found.error;
  const { attempt, mock } = found;

  /* The per-problem state the browser may know mid-attempt: whether it is
     locked, and what it scored if it is. Not the code -- the browser has
     its own draft and the stored copy is for the review screen. */
  const state = {};
  for (const q of mock.problems) {
    const got = attempt.per_problem[q.id];
    state[q.id] = got
      ? { submitted: !!got.submitted, marks: got.marks || 0, passed: got.passed || 0,
          total: got.total || 0, lang: got.lang || "cpp" }
      : { submitted: false, marks: 0, passed: 0, total: 0, lang: "cpp" };
  }

  return json({
    attempt_id: attempt.id,
    started_at: attempt.started_at,
    ended_at: attempt.ended_at,
    remaining_ms: remainingMs(attempt, mock),
    expired: expired(attempt, mock),
    score: attempt.score,
    state,
    mock: forAttempt(mock),
    runner: runnerStatus(env),
    langs: LANGS
  });
});

/* Shared validation for the two endpoints that take code. */
function sourceFault(payload) {
  const source = typeof payload.source === "string" ? payload.source : "";
  const lang = String(payload.lang || "cpp");
  if (!source.trim()) return { fault: "there is no code to run" };
  if (source.length > MAX_SOURCE) return { fault: `the source is over ${MAX_SOURCE / 1024} KB` };
  if (!LANG_IDS.has(lang)) return { fault: `unknown language '${lang}'` };
  return { source, lang };
}

route("POST", /^\/api\/oa\/attempt\/(\d+)\/run$/, async (match, request, env) => {
  const found = await openAttempt(env, match[1]);
  if (found.error) return found.error;
  const { attempt, mock } = found;
  if (expired(attempt, mock)) return bad("time is up on this attempt", 409);

  const payload = await body(request);
  const problem = mock.problems.find((q) => q.id === String(payload.problem_id || ""));
  if (!problem) return bad("unknown problem", 404);

  const checked = sourceFault(payload);
  if (checked.fault) return bad(checked.fault, 400);

  const result = await runSamples(env, problem, checked);
  return json({ problem_id: problem.id, ...result });
});

route("POST", /^\/api\/oa\/attempt\/(\d+)\/submit\/([A-Za-z0-9-]+)$/, async (match, request, env) => {
  const found = await openAttempt(env, match[1]);
  if (found.error) return found.error;
  const { attempt, mock, id } = found;

  const problem = mock.problems.find((q) => q.id === match[2]);
  if (!problem) return bad("unknown problem", 404);

  const already = attempt.per_problem[problem.id];
  if (already && already.submitted) return bad("this problem has already been submitted", 409);

  /* The clock is checked here rather than trusted from the client, and a
     submission that arrives after time is refused outright. The grace is
     for the round trip, not for thinking: a submit pressed at 00:00 should
     not be lost to network latency. */
  if (rawRemainingMs(attempt, mock) <= -GRACE_MIN * 60_000) {
    return bad("time is up on this attempt", 409);
  }

  const checked = sourceFault(await body(request));
  if (checked.fault) return bad(checked.fault, 400);

  const graded = await gradeProblem(env, problem, checked);
  if (!graded.ok) {
    // A backend failure is not a zero. Nothing is locked and it can be
    // submitted again once the runner is reachable.
    return json({ problem_id: problem.id, error: graded.error, kind: graded.kind }, 502);
  }

  const minutes = Math.round((Date.now() / 1000 - attempt.started_at) / 60);
  const per = { ...attempt.per_problem };
  per[problem.id] = {
    submitted: true,
    code: checked.source,
    lang: checked.lang,
    marks: graded.marks,
    passed: graded.passed,
    total: graded.total,
    tests: graded.tests,
    compile_error: graded.compile_error || null,
    minutes
  };
  await saveAttempt(env.DB, id, per);

  return json({
    problem_id: problem.id,
    locked: true,
    marks: graded.marks,
    out_of: problem.marks,
    passed: graded.passed,
    total: graded.total,
    compile_error: graded.compile_error || null,
    tests: graded.tests
  });
});

route("POST", /^\/api\/oa\/attempt\/(\d+)\/finish$/, async (match, _r, env) => {
  const found = await openAttempt(env, match[1], { mustBeLive: false });
  if (found.error) return found.error;
  const { attempt, mock, id } = found;

  if (attempt.ended_at) {
    return json({ attempt_id: id, already_finished: true, score: attempt.score });
  }

  const per = attempt.per_problem;
  const score = mock.problems.reduce((n, q) => n + ((per[q.id] && per[q.id].marks) || 0), 0);
  const ended = Date.now() / 1000;

  await env.DB.prepare("UPDATE oa_attempt SET ended_at = ?, score = ? WHERE id = ?")
    .bind(ended, score, id).run();

  /* PRD §7: feed the per-pattern accuracy back into the sheet. A problem
     that was attempted and fell short sets its sheet problem to confidence
     2 and flags it for revision, so the mock drives the revision queue
     without anyone transcribing anything.

     Confidence is only ever lowered. A mock is one data point under time
     pressure; it is good evidence that you do not know something and poor
     evidence that you do, so it may not raise a rating you earned by
     working the problem properly. */
  const failed = failedPatterns(mock, per);
  const written = [];
  for (const f of failed) {
    const row = await env.DB.prepare("SELECT confidence FROM dsa_progress WHERE problem_id = ?")
      .bind(f.problem_id).first();
    const current = row && row.confidence !== null && row.confidence !== undefined
      ? Number(row.confidence) : null;
    const next = current === null ? 2 : Math.min(current, 2);
    await patchDsaProgress(env.DB, f.problem_id, { confidence: next, revision: true });
    written.push({ ...f, confidence: next });
  }

  return json({
    attempt_id: id,
    score,
    total_marks: mock.total_marks,
    band: band(score, mock.total_marks),
    revision_queue: written
  });
});

route("GET", /^\/api\/oa\/attempt\/(\d+)\/review$/, async (match, _r, env) => {
  const found = await openAttempt(env, match[1], { mustBeLive: false });
  if (found.error) return found.error;
  const { attempt, mock } = found;

  /* 403 until finished, per PRD §4. The review payload is the answer key:
     the pattern, the intended approach, the complexity and the wrong turn.
     Handing it over while the clock is running would make the tab a hint
     system. */
  if (!attempt.ended_at) return bad("the review opens when the attempt is finished", 403);

  return json({
    attempt_id: attempt.id,
    started_at: attempt.started_at,
    ended_at: attempt.ended_at,
    score: attempt.score,
    total_marks: mock.total_marks,
    band: band(attempt.score || 0, mock.total_marks),
    per_problem: attempt.per_problem,
    mock: forAttempt(mock),
    review: forReview(mock),
    kind: attempt.kind || "scored",
    notes: attempt.notes || ""
  });
});

route("GET", /^\/api\/oa\/history$/, async (_m, _r, env) => {
  const { results } = await env.DB
    .prepare("SELECT * FROM oa_attempt WHERE ended_at IS NOT NULL ORDER BY started_at DESC LIMIT 50")
    .all();

  const attempts = [];
  /* Accuracy per pattern across every attempt, which is the number the
     history is for. One mock tells you whether you had a bad morning;
     the same pattern missed three times is a gap. */
  const patterns = new Map();

  for (const row of results || []) {
    const mock = getMock(row.mock_id);
    if (!mock) continue;
    let per = {};
    try { per = JSON.parse(row.per_problem || "{}") || {}; } catch { /* skip */ }

    const problems = mock.problems.map((q) => {
      const got = per[q.id] || {};
      const marks = got.marks || 0;
      const acc = patterns.get(q.tests_pattern) || { pattern: q.tests_pattern, earned: 0, out_of: 0, attempts: 0, related: q.related };
      acc.earned += marks;
      acc.out_of += q.marks;
      acc.attempts += 1;
      patterns.set(q.tests_pattern, acc);
      return { id: q.id, title: q.title, pattern: q.tests_pattern, marks, out_of: q.marks,
               submitted: !!got.submitted, minutes: got.minutes ?? null };
    });

    attempts.push({
      id: row.id, mock_id: row.mock_id, mock_title: mock.title, kind: row.kind || "scored",
      started_at: row.started_at, ended_at: row.ended_at,
      score: row.score, total_marks: mock.total_marks,
      band: band(row.score || 0, mock.total_marks),
      problems
    });
  }

  return json({
    attempts,
    patterns: [...patterns.values()]
      .map((p) => ({ ...p, percent: p.out_of ? Math.round((p.earned / p.out_of) * 100) : 0 }))
      .sort((a, b) => a.percent - b.percent)
  });
});

/* "Explain your approach (2 minutes)" on the review screen (§10). Stored
   now, graded in the v3 phase. Only once the attempt is over -- typing an
   explanation mid-attempt is just a slower way to think. */
route("PATCH", /^\/api\/oa\/attempt\/(\d+)\/notes$/, async (match, request, env) => {
  const found = await openAttempt(env, match[1], { mustBeLive: false });
  if (found.error) return found.error;
  if (!found.attempt.ended_at) return bad("the explanation opens when the attempt is finished", 403);
  const payload = await body(request);
  const notes = String(payload.notes || "").slice(0, MAX_NOTES);
  await env.DB.prepare("UPDATE oa_attempt SET notes = ? WHERE id = ?").bind(notes, found.id).run();
  return json({ attempt_id: found.id, notes });
});

/* Run the cron now. What it sends is still de-duplicated by notify_log, so
   pressing it twice, or alongside the real cron, sends nothing extra. With
   DSA_FAKE_CLOCK in local dev it runs at the page's faked time -- the
   "forced cron run at 11:00" of the PRD §17 walk-through. */
route("POST", /^\/api\/notify\/tick$/, async (_m, request, env) => {
  const now = clock(env, request);
  return json({ now, done: await tick(env, now) });
});

// ---------------------------------------------------------------- dispatch

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") return new Response("ok", { headers: { "content-type": "text/plain" } });

    if (!url.pathname.startsWith("/api/")) {
      // Everything that is not the API is a static asset. The Worker does
      // not touch the site itself or any of the DSA content.
      return env.ASSETS.fetch(request);
    }

    for (const { method, pattern, handler } of routes) {
      const match = url.pathname.match(pattern);
      if (!match) continue;
      if (request.method !== method) continue;

      // /api/session and /api/login have to answer before you are logged in.
      const open = url.pathname === "/api/session" || url.pathname === "/api/login";
      if (!open && !(await authorised(request, env))) return bad("password required", 401);

      try {
        return await handler(match, request, env, ctx);
      } catch (err) {
        console.error(`${request.method} ${url.pathname}`, err && err.stack);
        // Anything under /api answers in JSON, including crashes. The
        // default HTML error page reached the front end as a wall of markup
        // inside a toast instead of the actual reason.
        return bad(err && err.message ? err.message : "something broke", 500);
      }
    }

    // A path under /api that matches no route, or matches with the wrong
    // method, is a 404 rather than falling through to the site.
    return bad(`no route for ${request.method} ${url.pathname}`, 404);
  },

  /* Every 15 minutes (wrangler.toml). The handler decides in IST what is
     due; see worker/notify.js. */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(tick(env, event.scheduledTime || Date.now()).then(
      (done) => { if (done.length) console.log("[notify]", JSON.stringify(done)); },
      (err) => console.error("[notify] tick failed", err && err.stack)
    ));
  }
};
