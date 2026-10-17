/* ============================================================
   LAUNCH CONSOLE

   Two measurement systems under one shell. They share a countdown spine and
   an identity; they share no arithmetic. That separation is deliberate and
   load-bearing:

     Mastery rating  800-3200, Codeforces ladder, computed ONLY from the
                     1,328 rated topics. Nothing on a calendar can move it.
     Window integrity  starts at 100% and only ever falls, as one-shot dates
                     pass unchecked. Doors do not reopen, so this does not
                     recover either.

   Folding the 56 MBA items into the rating was the obvious merge and the
   wrong one -- ticking "booked a GMAT slot" would raise a number that is
   supposed to mean you can answer a segment-tree question.
   ============================================================ */

(function () {
  "use strict";

  var DATA = window.__DATA__ || {};
  var PL = DATA.placement || { ranks: [], tracks: [], badges: [] };
  // Pristine, never mutated -- every server delta is re-applied onto a
  // fresh clone of this rather than onto its own previous output, so
  // re-applying after a second edit cannot compound (move an item twice,
  // duplicate a pushed tag) the way repeatedly mutating one shared object
  // in place would.
  var MBA_BASE = DATA.mba || { phases: [], schools: [], excluded: [] };
  var MBA = MBA_BASE;
  /* Postings you have added yourself, fetched at boot.

     These used to arrive from the inbox agent, which read your mail and
     appended anything that looked like an internship or a placement. The
     agent is retired, so the tab is yours to fill: a notice on a board, a
     WhatsApp forward, a mail you read yourself. The baked value is only a
     fallback for opening this file with no API behind it. */
  var OPPS = (DATA.opportunities && DATA.opportunities.opportunities) || [];

  /* The DSA plan. Two pieces are baked in by the build -- the plan (days,
     roles, blocks, floor, cut order, stuck ladder, mock dates) and a thin
     index of all 120 problems with the titles of every theory page. That is
     enough to paint Today, the header strip, the plan grid and every link
     with no network. The teaching material is fetched per problem and day
     as static files. */
  var DSA = DATA.dsa || null;
  var DSA_PLAN = (DSA && DSA.plan) || null;
  var DSA_INDEX = (DSA && DSA.index) || null;
  var DSA_PROBLEMS = (DSA_INDEX && DSA_INDEX.problems) || [];
  var DSA_BY_ID = {};
  DSA_PROBLEMS.forEach(function (p) { DSA_BY_ID[p.id] = p; });

  /* What DSA work is worth against a ticked topic (PRD-v3 §13).

     A topic line is ten minutes of reading; a plan problem is forty-five
     with an empty file, whatever its role, so every role weighs 10 (the
     weights come from PLAN.roles). A TWIST closed as `skimmed` under the cut
     order is worth 3, and studying a problem's must-study sibling 2.
     Re-solves, drill and CS cards are habits, not mastery, and do not move
     the rating. */
  var DSA_SKIMMED_WEIGHT = 3;
  var DSA_SIBLING_WEIGHT = 2;
  function dsaRoleWeight(role) {
    var r = DSA_PLAN && DSA_PLAN.roles && DSA_PLAN.roles[role];
    return (r && r.weight) || 10;
  }

  /* The denominator is the whole plan -- 120 problems and their 120 must
     siblings -- not what has notes so far, so a batch landing never moves
     the rating. */
  var DSA_POOL = (DSA_PLAN && DSA_PLAN.problem_count) || 0;
  var DSA_TOTAL_WEIGHT = DSA_PROBLEMS.reduce(function (n, p) { return n + dsaRoleWeight(p.role); }, 0) +
    DSA_POOL * DSA_SIBLING_WEIGHT;

  var DAY1 = new Date("2026-12-01T00:00:00");
  var TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);

  /* ---------------------------------------------------------- storage

     The originals persisted through window.storage, the Claude Artifacts
     API. That was right there and wrong anywhere else: served from GitHub
     Pages, window.storage is undefined, save() returns early, and every
     checkbox is discarded on reload with no error. Since the rating is
     derived entirely from checked state, the page would have read 800 /
     Newbie forever.

     localStorage now, with a one-time migration from both legacy keys so
     nothing already ticked inside an Artifact is lost.                    */

  var KEY = "launch-console-v1";
  var LEGACY_PLACEMENT = "placement-ladder-v1";
  var LEGACY_MBA = "mba-launch-windows-v1";

  var S = { checked: {}, mba: {}, days: [], badges: [], open: {}, opps: {}, quest: {}, dayCount: {} };
  var memOnly = false;
  var saveTimer = null;

  function readLegacy(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw);
        S = {
          checked: p.checked || {},
          mba: p.mba || {},
          days: p.days || [],
          badges: p.badges || [],
          open: p.open || {},
          opps: p.opps || {},
          quest: p.quest || {},
          dayCount: p.dayCount || {}
        };
        return;
      }
      var oldP = readLegacy(LEGACY_PLACEMENT);
      var oldM = readLegacy(LEGACY_MBA);
      if (oldP) {
        S.checked = oldP.checked || {};
        S.days = oldP.days || [];
        S.badges = oldP.badges || [];
        S.open = oldP.open || {};
      }
      if (oldM) S.mba = oldM;
      if (oldP || oldM) save();
    } catch (e) {
      memOnly = true;
    }
  }

  /* Progress lives on the server so it is the same on every device. The
     browser copy is a cache, not the record: it makes the first paint
     instant and keeps the page usable if the API is unreachable, but the
     server copy wins whenever it is newer. */

  var SYNC = { on: false, ts: 0, state: "local", timer: null };

  function setSync(state) {
    SYNC.state = state;
    var el = document.getElementById("syncNote");
    if (!el) return;
    el.textContent = {
      local: "this browser only",
      syncing: "saving…",
      synced: "synced across your devices",
      error: "not synced — changes are local"
    }[state] || "";
    el.className = "sync " + state;
  }

  function save() {
    if (!memOnly) {
      try {
        localStorage.setItem(KEY, JSON.stringify(S));
      } catch (e) {
        memOnly = true;
        toast("Could not cache progress in this browser.");
      }
    }
    if (!SYNC.on) return;

    clearTimeout(saveTimer);
    setSync("syncing");
    // Debounced: ticking ten boxes quickly is one write, not ten.
    saveTimer = setTimeout(function () {
      fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: S })
      })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (r) { SYNC.ts = r.updated_ts; setSync("synced"); })
        .catch(function () { setSync("error"); });
    }, 600);
  }

  /* Adopt the server's copy if it has one. Called once at boot; the local
     cache has already painted by then, so this only ever corrects it. */
  function syncFromServer() {
    return fetch("/api/progress")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (r) {
        SYNC.on = true;
        SYNC.ts = r.updated_ts || 0;
        if (r.updated_ts && r.data && Object.keys(r.data).length) {
          S = {
            checked: r.data.checked || {},
            mba: r.data.mba || {},
            days: r.data.days || [],
            badges: r.data.badges || [],
            open: r.data.open || {},
            opps: r.data.opps || {},
            quest: r.data.quest || {},
            dayCount: r.data.dayCount || {}
          };
          try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* cache only */ }
          setSync("synced");
          return true;
        }
        // Nothing saved server-side yet. Push what this browser has, so an
        // existing local history becomes the shared starting point instead
        // of being wiped by the first save from another device.
        setSync("synced");
        save();
        return false;
      })
      .catch(function () { SYNC.on = false; setSync("local"); return false; });
  }

  /* ------------------------------------------------- DSA progress store

     Its own key and its own blob, deliberately not folded into S.

     S is PUT whole to /api/progress on every change and that endpoint caps
     the document at 512 KB, which is correct for what it holds: an id and a
     boolean per tick. A DSA row holds notes in markdown, an approach line
     and a GoodNotes reference. Six hundred of those would eventually push a
     placement tick over the cap and start failing saves that have nothing
     to do with DSA -- the tracker would break because you wrote too much
     about a graph problem.

     So: separate cache key, separate blob, and writes that PATCH one
     problem instead of re-uploading the sheet. */

  /* v3 key: the v2 cache holds rows for ids the plan no longer has. */
  var DSA_KEY = "launch-console-dsa-v3";
  var DSA_S = { problems: {}, siblings: {}, drill: {}, days: {} };
  var DSA_SYNC = { on: false, ts: 0 };

  var DSA_DEFAULTS = {
    status: "todo", revision: false, notes: "", tags: [],
    confidence: null, last_revised: null, goodnotes_ref: "", my_approach: "",
    my_pseudocode: "", first_done_at: null, minutes_spent: null,
    resolve_stage: 0, next_resolve_on: null, cut_state: ""
  };

  /* A problem's user fields, defaults filled in. Absent means untouched --
     the store only ever holds rows that have been written to. */
  function dsaRow(id) {
    var stored = DSA_S.problems[id] || {};
    var out = {};
    for (var k in DSA_DEFAULTS) {
      out[k] = stored[k] === undefined ? DSA_DEFAULTS[k] : stored[k];
    }
    out.tags = (out.tags || []).slice();
    return out;
  }

  function dsaAdopt(p) {
    DSA_S = {
      problems: (p && p.problems) || {},
      siblings: (p && p.siblings) || {},
      drill: (p && p.drill) || {},
      days: (p && p.days) || {}
    };
  }

  function dsaLoad() {
    try {
      var raw = localStorage.getItem(DSA_KEY);
      if (raw) dsaAdopt(JSON.parse(raw));
    } catch (e) { /* cache only; the server is the record */ }
  }

  function dsaCache() {
    try { localStorage.setItem(DSA_KEY, JSON.stringify(DSA_S)); } catch (e) { /* full or blocked */ }
  }

  /* Write one problem's fields. Optimistic: the row updates locally and the
     UI repaints at once, and the PATCH reconciles afterwards with the
     server's row -- which is authoritative, because the server is what
     stamps first_done_at and the re-solve date. A failure says so rather
     than silently reverting. */
  function dsaPatch(id, patch) {
    var row = DSA_S.problems[id] || (DSA_S.problems[id] = {});
    var before = dsaRow(id);
    for (var k in patch) row[k] = patch[k];
    if (patch.status && patch.status !== "todo") {
      if (patch.last_revised === undefined) row.last_revised = dsaToday();
      // Mirror the server so an offline tick schedules the same re-solve.
      if (!before.first_done_at) {
        row.first_done_at = dsaToday();
        row.next_resolve_on = DSA_CORE.nextResolveOn(row.first_done_at, 0);
        row.resolve_stage = 0;
      }
    }
    if (patch.status === "todo" && before.first_done_at && !before.resolve_stage) {
      row.first_done_at = null; row.next_resolve_on = null; row.minutes_spent = null;
    }
    dsaCache();

    if (!DSA_SYNC.on) return Promise.resolve(row);

    return api("/api/dsa/progress/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify(patch) })
      .then(function (res) {
        var clean = res.progress || {};
        var bare = true;
        for (var k in DSA_DEFAULTS) {
          var d = DSA_DEFAULTS[k];
          var v = clean[k];
          if (k === "tags" ? (v || []).length : v !== d) { bare = false; break; }
        }
        if (bare) delete DSA_S.problems[id]; else DSA_S.problems[id] = clean;
        dsaCache();
        return clean;
      })
      .catch(function (e) {
        toast("Not saved to the server: " + e.message);
        return row;
      });
  }

  /* A cold re-solve. Server-only: the next date depends on the stored row,
     and an offline re-solve guessing at it would put two different dates in
     two places. */
  function dsaResolve(id, confidence) {
    if (!DSA_SYNC.on) {
      var row = dsaRow(id);
      var next = DSA_CORE.afterResolve(row, confidence, dsaToday());
      dsaPatch(id, { resolve_stage: next.resolve_stage, next_resolve_on: next.next_resolve_on, confidence: confidence });
      return Promise.resolve();
    }
    return api("/api/dsa/resolve/" + encodeURIComponent(id), { method: "POST", body: JSON.stringify({ confidence: confidence }) })
      .then(function (res) { DSA_S.problems[id] = res.progress; dsaCache(); })
      .catch(function (e) { toast("Re-solve not saved: " + e.message); });
  }

  /* The three v3 ledgers share one shape of write: merge locally, send the
     patch, take the server's row back. */
  function dsaLedgerPatch(store, path, id, patch, key) {
    var cur = DSA_S[store][id] || {};
    for (var k in patch) cur[k] = patch[k];
    DSA_S[store][id] = cur;
    dsaCache();
    if (!DSA_SYNC.on) return Promise.resolve(cur);
    return api(path + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify(patch) })
      .then(function (res) { DSA_S[store][id] = res[key]; dsaCache(); return res[key]; })
      .catch(function (e) { toast("Not saved to the server: " + e.message); return cur; });
  }
  function dsaPatchSibling(id, patch) { return dsaLedgerPatch("siblings", "/api/dsa/sibling/", id, patch, "sibling"); }
  function dsaPatchDrill(id, patch) { return dsaLedgerPatch("drill", "/api/dsa/drill/", id, patch, "drill"); }
  function dsaPatchDay(day, patch) { return dsaLedgerPatch("days", "/api/dsa/day/", day, patch, "ledger"); }

  function dsaSyncFromServer() {
    return api("/api/dsa/progress")
      .then(function (res) {
        DSA_SYNC.on = true;
        DSA_SYNC.ts = res.updated_ts || 0;
        if (res.updated_ts) {
          dsaAdopt(res);
          dsaCache();
          return true;
        }
        // Nothing server-side yet: push this browser's rows so a local
        // history becomes the shared starting point.
        Object.keys(DSA_S.problems).forEach(function (id) {
          if (DSA_BY_ID[id]) dsaPatch(id, DSA_S.problems[id]);
        });
        return false;
      })
      .catch(function () { DSA_SYNC.on = false; return false; });
  }

  /* ---------------------------------------------------------- helpers */

  /* One place every write goes through.

     This used to live in the Agent tab, which was the only part of the page
     that talked to a server. Now that progress, the MBA overlay, goals and
     opportunities all do, it belongs with the rest of the helpers.

     Two things it is responsible for. It carries the console password when
     one is set -- optional, exactly as before: unset means the URL is the
     only key. And it turns a failed response into an Error carrying the
     server's own message, because every /api route answers in JSON even
     when it crashes, and "500" in a toast tells you nothing that the actual
     reason would not tell you better. */
  var API = { password: "", locked: false };

  function api(path, opts) {
    var o = opts || {};
    o.headers = Object.assign({ "Content-Type": "application/json" }, o.headers || {});
    if (API.password) o.headers["X-Console-Password"] = API.password;
    // ?clock=... (see DSA_CLOCK). A deployed Worker ignores this header.
    if (typeof DSA_CLOCK !== "undefined" && DSA_CLOCK) o.headers["X-DSA-Clock"] = new Date(dsaNow()).toISOString();
    return fetch(path, o).then(function (r) {
      if (r.status === 401) { API.locked = true; throw new Error("password required"); }
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          throw new Error(String(j.error || r.status).slice(0, 240));
        });
      }
      return r.json();
    });
  }


  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function dateStr(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }
  function today() { return dateStr(new Date()); }

  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function daysUntil(iso) {
    var d = new Date(iso + "T00:00:00");
    return Math.round((d - TODAY) / 86400000);
  }
  function fmtDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.getDate() + " " + MON[d.getMonth()] + " " + d.getFullYear();
  }
  function level(dd) {
    if (dd === null) return "cool";
    if (dd < 0) return "past";
    if (dd <= 30) return "crit";
    if (dd <= 90) return "warn";
    return "cool";
  }
  function tminus(dd) {
    if (dd < 0) return "CLOSED";
    if (dd === 0) return "TODAY";
    return "T−" + dd + "d";
  }

  /* ---------------------------------------------------------- index */

  var INDEX = [];
  PL.tracks.forEach(function (t) {
    t.sections.forEach(function (sec) {
      sec.g.forEach(function (g) {
        g.i.forEach(function (label) {
          INDEX.push({
            id: hash(t.id + "|" + sec.n + "|" + label),
            track: t.id, rated: !!t.rated, sec: sec.n, grp: g.n, label: label
          });
        });
      });
    });
  });
  var RATED = INDEX.filter(function (x) { return x.rated; });

  /* MBA items flattened, excluded ones included -- the brief was explicit
     that declined options stay visible with live dates, so that "I did not
     apply" never quietly becomes "I forgot to apply".

     A function rather than a one-time block: an assistant can add a whole
     new item or tag an existing one at runtime (add_mba_item / add_mba_tags
     over MCP), and rebuildMbaItems() re-derives this flattened list from
     MBA.phases/MBA.excluded after boot() splices those in, the same way
     the Opportunities tab already re-renders after its own live fetch. */
  var MBA_ITEMS = [];
  function rebuildMbaItems() {
    MBA_ITEMS = [];
    MBA.phases.forEach(function (p) {
      (p.items || []).forEach(function (it) {
        MBA_ITEMS.push({ item: it, phase: p.n, phaseTitle: p.t, excluded: false });
      });
    });
    (MBA.excluded || []).forEach(function (it) {
      MBA_ITEMS.push({ item: it, phase: "EXCLUDED", phaseTitle: "Decided against", excluded: true });
    });
  }
  rebuildMbaItems();

  /* ---------------------------------------------------------- instrument 1
     Mastery rating. Identical maths to the original tracker: 800 at zero,
     3200 at full clear, linear across the 1,328 rated topics. */

  function streakCount() {
    var n = 0;
    var d = new Date();
    for (;;) {
      if (S.days.indexOf(dateStr(d)) === -1) break;
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  /* Solved DSA problems, weighted. `revisit` deliberately does not count:
     it is the status for "I got there but I could not do it again cold",
     and a rating that treats that as mastery is lying in exactly the way
     window integrity refuses to. Marking something revisit gives the points
     back, which is the point -- the number only ever reflects what you can
     currently do. */
  /* What counts as done.

     Both statuses that are not `todo`. A problem you got working and then
     marked `revisit` was still solved -- the flag says you want it again
     cold, not that it never happened, and the revision queue is where that
     want gets acted on. Scoring it as zero meant being honest about your
     own recall cost you rating, which taught exactly the wrong reflex.

     The two statuses still mean different things everywhere it matters:
     `revisit` is what puts a problem in the queue, and it is shown
     separately in every count. It just is not worth less. */
  function dsaIsDone(status) {
    return DSA_CORE.isDone(status);
  }

  function dsaScore() {
    var earned = 0, done = 0, solved = 0, revisit = 0, skimmed = 0, siblings = 0;
    for (var id in DSA_S.problems) {
      var p = DSA_BY_ID[id];
      if (!p) continue;                       // an id the plan no longer has
      var status = (DSA_S.problems[id] || {}).status;
      if (!dsaIsDone(status)) continue;
      done++;
      if (status === "skimmed") { skimmed++; earned += DSA_SKIMMED_WEIGHT; continue; }
      earned += dsaRoleWeight(p.role);
      if (status === "revisit") revisit++; else solved++;
    }
    DSA_PROBLEMS.forEach(function (p) {
      if (p.must && (DSA_S.siblings[p.must.id] || {}).studied) { siblings++; earned += DSA_SIBLING_WEIGHT; }
    });
    return {
      earned: earned, done: done, solved: solved, revisit: revisit, skimmed: skimmed, siblings: siblings,
      weight: DSA_TOTAL_WEIGHT, pool: DSA_POOL
    };
  }

  function stats() {
    var topicsDone = RATED.filter(function (x) { return S.checked[x.id]; }).length;
    var dsa = dsaScore();

    /* One ladder, two contributions. A ticked topic is one unit; an
       attempted problem is one to three depending on tier. At the full
       sheet DSA is just under half the climb, which is the weight the sheet
       earns. */
    var done = topicsDone + dsa.earned;
    var total = RATED.length + dsa.weight;
    var pct = total ? (done / total) * 100 : 0;
    var st = {
      done: done, total: total, pct: pct,
      topicsDone: topicsDone, topicsTotal: RATED.length,
      dsa: dsa,
      rating: Math.round(800 + (pct / 100) * 2400),
      streak: streakCount(),
      secDone: function (track, secName) {
        var items = INDEX.filter(function (x) { return x.track === track && x.sec === secName; });
        return items.length > 0 && items.every(function (x) { return S.checked[x.id]; });
      },
      trackPct: function (track) {
        var items = INDEX.filter(function (x) { return x.track === track; });
        if (!items.length) return 0;
        var d = items.filter(function (x) { return S.checked[x.id]; }).length;
        return (d / items.length) * 100;
      }
    };
    return st;
  }

  function rankFor(rating) {
    var r = PL.ranks[0];
    for (var i = 0; i < PL.ranks.length; i++) if (rating >= PL.ranks[i].min) r = PL.ranks[i];
    return r;
  }

  /* Badge unlock rules. Predicates live here rather than in data/ because
     they are logic; the content updater must never be able to rewrite what
     counts as an achievement. Keyed by the badge ids in placement.json. */
  var BADGE_RULES = {
    first: function (s) { return s.done >= 1; },
    fifty: function (s) { return s.done >= 50; },
    twofifty: function (s) { return s.done >= 250; },
    blue: function (s) { return s.rating >= 1600; },
    purple: function (s) { return s.rating >= 1900; },
    orange: function (s) { return s.rating >= 2100; },
    core4: function (s) {
      return s.secDone("sde", "CS Core — Operating Systems") &&
        s.secDone("sde", "CS Core — DBMS") &&
        s.secDone("sde", "CS Core — Networks") &&
        s.secDone("sde", "CS Core — OOP & architecture");
    },
    graph: function (s) { return s.secDone("sde", "DSA — Graphs"); },
    dp: function (s) { return s.secDone("sde", "DSA — Dynamic programming"); },
    lld: function (s) { return s.secDone("sde", "Low-Level Design"); },
    hld: function (s) { return s.secDone("sde", "High-Level Design"); },
    tf: function (s) { return s.secDone("ds", "Transformers"); },
    genai: function (s) { return s.secDone("ds", "GenAI & LLM systems"); },
    stats: function (s) { return s.secDone("ds", "Mathematics"); },
    cvdone: function (s) { return s.trackPct("cv") >= 100; },
    dual: function (s) { return s.trackPct("sde") >= 25 && s.trackPct("ds") >= 25; },
    st7: function (s) { return s.streak >= 7; },
    st30: function (s) { return s.streak >= 30; },
    half: function (s) { return s.pct >= 50; },
    full: function (s) { return s.pct >= 100; }
  };

  /* Badges reflect the current state, they are not a permanent record of
     having once qualified. Untick the work and the badge goes with it --
     otherwise the count drifts upward and stops meaning anything. */
  function refreshBadges(st) {
    var gained = [];
    PL.badges.forEach(function (b) {
      var rule = BADGE_RULES[b.id];
      if (!rule) return;
      var at = S.badges.indexOf(b.id);
      var earned = !!rule(st);
      if (earned && at === -1) { S.badges.push(b.id); gained.push(b); }
      else if (!earned && at !== -1) { S.badges.splice(at, 1); }
    });
    return gained;
  }

  /* ---------------------------------------------------------- instrument 2
     Window integrity. Not a score you build; a score you can only lose.
     A dated item whose date has passed while unchecked is counted missed,
     permanently. This mirrors the actual physics the MBA brief was built
     around: one-shot programmes with no reapplication. */

  function windowStats() {
    var dated = MBA_ITEMS.filter(function (m) { return m.item.date; });
    var missed = 0, cleared = 0, open = 0;
    dated.forEach(function (m) {
      var checked = !!S.mba[m.item.id];
      if (checked) cleared++;
      else if (daysUntil(m.item.date) < 0) missed++;
      else open++;
    });
    var total = dated.length;
    var oneshotMissed = dated.filter(function (m) {
      return !S.mba[m.item.id] && daysUntil(m.item.date) < 0 &&
        (m.item.tags || []).indexOf("oneshot") !== -1;
    }).length;

    var allTracked = MBA_ITEMS.length;
    var allDone = MBA_ITEMS.filter(function (m) { return S.mba[m.item.id]; }).length;

    return {
      total: total, cleared: cleared, missed: missed, open: open,
      oneshotMissed: oneshotMissed,
      integrity: total ? ((total - missed) / total) * 100 : 100,
      allTracked: allTracked, allDone: allDone,
      pct: allTracked ? (allDone / allTracked) * 100 : 0
    };
  }

  /* Nearest unchecked dated commitments across BOTH domains. This is the
     only place the two systems touch, and it touches only time. */
  function spine(limit) {
    var out = [];
    MBA_ITEMS.forEach(function (m) {
      if (!m.item.date || S.mba[m.item.id]) return;
      out.push({ date: m.item.date, label: m.item.task, domain: "mba" });
    });
    var d1 = daysUntil("2026-12-01");
    if (d1 >= 0) out.push({ date: "2026-12-01", label: "IIT KGP placements, Day 1", domain: "placement" });
    out.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var future = out.filter(function (x) { return daysUntil(x.date) >= 0; });
    return (future.length ? future : out).slice(0, limit || 4);
  }

  /* ---------------------------------------------------------- toast */

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  /* ---------------------------------------------------------- header */

  function renderHeader() {
    var st = stats();
    var ws = windowStats();
    var rank = rankFor(st.rating);

    document.documentElement.style.setProperty("--accent", rank.c);
    document.documentElement.style.setProperty("--accent-soft", hexSoft(rank.c));

    document.getElementById("handle").textContent = rank.n;
    document.getElementById("ratingVal").textContent = st.rating;
    document.getElementById("rankTag").textContent = rank.n;

    var scopeEl = document.getElementById("ratingScope");
    if (scopeEl) {
      scopeEl.innerHTML = "Mastery rating &middot; " + st.topicsTotal.toLocaleString() + " topics" +
        (DSA_POOL ? " + " + DSA_POOL + " problems" : "");
    }

    // ladder
    var idx = PL.ranks.indexOf(rank);
    var trackEl = document.getElementById("ladderTrack");
    trackEl.innerHTML = PL.ranks.map(function (r, i) {
      return '<i class="' + (i <= idx ? "lit" : "") + '" style="background:' + r.c + '"></i>';
    }).join("");

    var lo = rank.min;
    var next = PL.ranks[idx + 1];
    var hi = next ? next.min : 3200;
    var within = Math.max(0, Math.min(1, (st.rating - lo) / (hi - lo)));
    var seg = 100 / PL.ranks.length;
    document.getElementById("ladderMarker").style.left = (idx * seg + within * seg) + "%";

    var noteEl = document.getElementById("rankNote");
    if (next) {
      // The ladder now has two currencies. Quoting the gap in one of them
      // and calling the other "topics" would be wrong by a factor of three,
      // so quote both and let the cheaper one be obvious.
      var perUnit = 2400 / st.total;
      var gap = next.min - st.rating;
      var needTopics = Math.ceil(gap / perUnit);
      var needProblems = Math.ceil(gap / (perUnit * dsaRoleWeight("LEARN")));
      noteEl.innerHTML = needTopics + " topics <i>or</i> " + needProblems +
        " plan problems to <b>" + esc(next.n) + "</b>";
    } else {
      noteEl.textContent = "Top of the ladder.";
    }

    // window integrity
    document.getElementById("winVal").textContent = Math.round(ws.integrity) + "%";
    document.getElementById("winTag").textContent = ws.missed ? ws.missed + " missed" : "intact";
    var winNote = document.getElementById("winNote");
    if (ws.oneshotMissed) {
      winNote.innerHTML = "<b>" + ws.oneshotMissed + " one-shot window" +
        (ws.oneshotMissed > 1 ? "s" : "") + " closed permanently</b>";
    } else if (ws.missed) {
      winNote.innerHTML = ws.missed + " date" + (ws.missed > 1 ? "s" : "") +
        " passed unchecked &middot; <b>" + ws.open + " still open</b>";
    } else {
      winNote.innerHTML = "<b>" + ws.open + "</b> open &middot; " + ws.cleared + " cleared";
    }

    var barEl = document.getElementById("winBar");
    barEl.innerHTML =
      '<i class="done" style="flex:' + ws.cleared + '"></i>' +
      '<i class="open" style="flex:' + ws.open + '"></i>' +
      '<i class="missed" style="flex:' + ws.missed + '"></i>';

    // shared spine
    document.getElementById("spine").innerHTML = spine(4).map(function (s) {
      var dd = daysUntil(s.date);
      var lv = level(dd);
      return '<div class="tick ' + lv + '">' +
        '<div class="t">' + (s.domain === "mba" ? "MBA" : "PLACEMENT") + "</div>" +
        '<div class="d">' + tminus(dd) + "</div>" +
        '<div class="n" title="' + esc(s.label) + '">' + esc(s.label) + "</div>" +
        "</div>";
    }).join("") || '<div class="tick"><div class="t">CLEAR</div><div class="d">&mdash;</div>' +
      '<div class="n">no open dated commitments</div></div>';

    // strip
    var dd1 = daysUntil("2026-12-01");
    document.getElementById("days").textContent = dd1 >= 0 ? dd1 : "—";
    /* Counted things, not weighted units. The rating is weighted; this tile
       is "how much of the pile is behind you", and a tile that read 171 when
       57 things were done would just look broken. */
    var clearedN = st.topicsDone + st.dsa.done;
    var clearedOf = st.topicsTotal + st.dsa.pool;
    document.getElementById("cleared").textContent = clearedN;
    document.getElementById("clearedSub").textContent = DSA_POOL
      ? st.topicsDone + " topics · " + st.dsa.done + " problems"
      : "of " + clearedOf;
    document.getElementById("streak").textContent = st.streak;
    document.getElementById("badgeCount").textContent = S.badges.length;
    document.getElementById("badgeSub").textContent = "of " + PL.badges.length + " unlocked";
  }

  /* ---------------------------------------------------------- codeforces

     Real rating and rank, as opposed to the mastery rating above it, which
     is this tracker's own scoring of how much of the curriculum you have
     cleared. Two numbers that look alike and mean nothing like each other,
     so the tiles say CF on them and sit apart from the four self-measured
     ones. */

  var CF = { data: null, loading: false, at: 0 };

  /* Codeforces' own rank colours. Not the placement ladder's -- that one is
     recoloured for a light background and shifts with your progress, and
     borrowing it here would imply the two ratings are the same measurement. */
  var CF_COLOURS = [
    [3000, "#aa0000"], [2600, "#ff0000"], [2400, "#ff8c00"], [2100, "#ff8c00"],
    [1900, "#aa00aa"], [1600, "#0000ff"], [1400, "#03a89e"], [1200, "#008000"],
    [0, "#808080"]
  ];
  function cfColour(rating) {
    for (var i = 0; i < CF_COLOURS.length; i++) {
      if (rating >= CF_COLOURS[i][0]) return CF_COLOURS[i][1];
    }
    return "#808080";
  }

  function commas(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  /* "in 3 d 4 h" / "in 12 min" / "live now". A contest three days out and one
     starting in ten minutes are different kinds of fact. */
  function untilContest(startTs, durationSeconds) {
    var secs = startTs - Date.now() / 1000;
    if (secs < 0) {
      return secs > -(durationSeconds || 7200) ? "live now" : "";
    }
    var d = Math.floor(secs / 86400), h = Math.floor((secs % 86400) / 3600);
    var m = Math.floor((secs % 3600) / 60);
    if (d) return "in " + d + "d " + h + "h";
    if (h) return "in " + h + "h " + m + "m";
    return "in " + m + " min";
  }

  function loadCF(force) {
    if (CF.loading) return;
    CF.loading = true;
    api("/api/codeforces" + (force ? "?refresh=1" : ""))
      .then(function (d) { CF.data = d; CF.at = Date.now(); })
      .catch(function (e) { CF.data = { error: e.message || String(e) }; })
      .then(function () { CF.loading = false; renderCF(); });
  }

  function renderCF() {
    var d = CF.data;
    var set = function (id, text, colour) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = text;
      if (colour !== undefined) el.style.color = colour || "";
    };

    if (!d) return;

    if (!d.handle && !d.rating) {
      /* No handle yet. The tile is the place to set it -- asking for it in a
         settings page three clicks away would leave these reading "—" with no
         hint as to why. */
      set("cfRating", "set", "");
      set("cfRatingSub", "click to add your handle");
      var stat = document.getElementById("cfRatingStat");
      if (stat && !stat.dataset.bound) {
        stat.dataset.bound = "1";
        stat.style.cursor = "pointer";
        stat.onclick = askHandle;
      }
      ["cfWorld", "cfAir", "cfContest"].forEach(function (id) { set(id, "—", ""); });
      if (d.next_contest) showContest(d.next_contest);
      return;
    }

    if (d.rating === null || d.rating === undefined) {
      set("cfRating", "unrated", "");
      set("cfRatingSub", d.error ? d.error.slice(0, 40) : d.handle);
      ["cfWorld", "cfAir"].forEach(function (id) { set(id, "—", ""); });
    } else {
      set("cfRating", commas(d.rating), cfColour(d.rating));
      set("cfRatingSub", (d.title || "") + (d.max_rating ? " · max " + commas(d.max_rating) : ""));
      set("cfWorld", d.world_rank ? "#" + commas(d.world_rank) : "—", "");
      // world_total is total_pages*200 -- an approximation to within one
      // page's width, not a precise headcount, so it says "~".
      set("cfWorldSub", d.world_total ? "of ~" + commas(d.world_total) + " rated" : "\u00a0");
      var air = d.country === "India" ? d.country_rank : null;
      set("cfAir", air ? "#" + commas(air) : "—", "");
      // country_total, unlike world_total, is exact: it is Codeforces' own
      // stated count for the country, lifted straight from its filter.
      set("cfAirSub",
        air ? "of " + commas(d.country_total) + " rated India"
            : (d.country ? d.country : "no country set on your profile"));
    }
    showContest(d.next_contest);

    var sub = document.getElementById("cfRatingSub");
    if (sub && d.error) { sub.textContent = d.error.slice(0, 46); sub.title = d.error; }
  }

  function showContest(c) {
    var v = document.getElementById("cfContest");
    var s = document.getElementById("cfContestSub");
    if (!v || !s) return;
    if (!c) { v.textContent = "—"; s.textContent = "none announced"; return; }
    v.textContent = untilContest(c.start_ts, c.duration_seconds) || "—";
    s.textContent = c.name;
    s.title = c.name + " · " + new Date(c.start_ts * 1000).toLocaleString();
  }

  /* The handle used to be stored in the agent's settings overlay, which was
     the only server-side settings store there was. It now belongs to the
     Codeforces endpoint itself -- which is where it was always used, and
     means the tiles read the same on every device without a settings tab
     existing at all. */
  function askHandle() {
    var current = (CF.data && CF.data.handle) || "";
    var handle = window.prompt("Your Codeforces handle", current);
    if (handle === null) return;
    handle = handle.trim();
    api("/api/codeforces?handle=" + encodeURIComponent(handle))
      .then(function (r) {
        if (handle && r.error) {
          toast(r.error);
          return;
        }
        toast(r.cf_handle ? "Handle set. Fetching…" : "Handle cleared.");
        loadCF(true);
      })
      .catch(function (e) { toast("Could not save: " + e.message); });
  }

  function hexSoft(hex) {
    var h = hex.replace("#", "");
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + ",.14)";
  }

  /* ---------------------------------------------------------- tabs */

  /* Three top-level parts. Sub-tabs live inside a part, so the placement
     track list no longer sits next to unrelated things. */
  /* DSA sits alongside Placement and MBA rather than inside
     Placement. It is not a track -- it has its own days, phases, theory,
     templates and revision queue, and burying five views under the SDE tab
     would make the thing you use every day the hardest to reach. */
  var SECTIONS = [
    { id: "placement", label: "Placement" },
    { id: "dsa", label: "DSA Sheet" },
    { id: "mba", label: "MBA" }
  ];
  // Hidden entirely until the content has been imported, rather than showing
  // an empty tab that looks broken.
  if (!DSA_PLAN) SECTIONS.splice(1, 1);

  var TABS = [{ id: "overview", label: "Overview", domain: "placement", section: "placement" }];
  PL.tracks.forEach(function (t) {
    TABS.push({ id: t.id, label: t.label, domain: "placement", section: "placement", track: t });
  });
  TABS.push({ id: "career", label: "Opportunities", domain: "placement", section: "placement" });
  TABS.push({ id: "dsa-today", label: "Today", domain: "dsa", section: "dsa" });
  TABS.push({ id: "dsa-plan", label: "Plan", domain: "dsa", section: "dsa" });
  TABS.push({ id: "dsa-theory", label: "Theory", domain: "dsa", section: "dsa" });
  TABS.push({ id: "dsa-revision", label: "Revision", domain: "dsa", section: "dsa" });
  TABS.push({ id: "dsa-browse", label: "Browse", domain: "dsa", section: "dsa" });
  TABS.push({ id: "dsa-oa", label: "OAs", domain: "dsa", section: "dsa" });
  TABS.push({ id: "mba", label: "MBA Windows", domain: "mba", section: "mba" });

  var SECTION = "placement";
  var ACTIVE = "overview";
  var QUERY = "";
  var FILTER = "all";   // all | todo | done

  function sectionTabs() {
    return TABS.filter(function (t) { return t.section === SECTION; });
  }

  function renderSections() {
    document.getElementById("sections").innerHTML = SECTIONS.map(function (s) {
      return '<button class="seg" role="tab" data-section="' + s.id +
        '" aria-selected="' + (SECTION === s.id) + '">' + esc(s.label) + "</button>";
    }).join("");

    document.querySelectorAll(".seg").forEach(function (b) {
      b.onclick = function () {
        SECTION = b.dataset.section;
        ACTIVE = sectionTabs()[0].id;
        QUERY = "";
        location.hash = SECTION;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    });
  }

  function renderTabs() {
    var st = stats();
    var mine = sectionTabs();
    // A single-view section does not need a sub-tab bar above it.
    var bar = document.getElementById("tabs");
    bar.classList.toggle("hide", mine.length < 2);
    bar.innerHTML = mine.map(function (t) {
      var pc = "";
      if (t.track) {
        pc = ' <span class="pc">' + Math.round(st.trackPct(t.track.id)) + "%</span>";
      } else if (t.id === "mba") {
        var ws = windowStats();
        pc = ' <span class="pc">' + Math.round(ws.pct) + "%</span>";
      } else if (t.id === "career") {
        var live = liveOpps().length;
        pc = live ? ' <span class="pc">' + live + "</span>" : "";
      }
      return '<button class="tab" role="tab" data-tab="' + t.id + '" data-domain="' + t.domain +
        '" aria-selected="' + (ACTIVE === t.id) + '">' + esc(t.label) + pc + "</button>";
    }).join("");

    document.querySelectorAll(".tab").forEach(function (b) {
      b.onclick = function () {
        ACTIVE = b.dataset.tab;
        QUERY = "";
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    });
  }

  /* ---------------------------------------------------------- panels */

  function itemRow(x) {
    var on = S.checked[x.id];
    return '<label class="item' + (on ? " on" : "") + '">' +
      '<input type="checkbox" data-id="' + x.id + '"' + (on ? " checked" : "") + ">" +
      '<span class="box"></span><span class="txt">' + esc(x.label) + "</span></label>";
  }

  function renderTrack(track) {
    var q = QUERY.toLowerCase();
    var trackItems = INDEX.filter(function (x) { return x.track === track.id; });
    var trackDone = trackItems.filter(function (x) { return S.checked[x.id]; }).length;
    var counts = {
      all: trackItems.length,
      todo: trackItems.length - trackDone,
      done: trackDone
    };

    // Filtering narrows the view, so sections open regardless of their
    // collapsed state -- a filtered result hidden inside a shut section
    // reads as "no matches".
    var narrowed = !!q || FILTER !== "all";

    var html = '<div class="toolbar">' +
      '<input class="search" id="search" placeholder="Filter topics in ' + esc(track.label) +
      '…" value="' + esc(QUERY) + '">' +
      '<div class="filters">' +
        [["all", "All"], ["todo", "To do"], ["done", "Done"]].map(function (f) {
          return '<button class="btn filt" data-filter="' + f[0] + '" aria-pressed="' +
            (FILTER === f[0]) + '">' + f[1] +
            ' <span class="pc">' + counts[f[0]] + "</span></button>";
        }).join("") +
      "</div>" +
      '<button class="btn" data-all="1">Expand all</button>' +
      '<button class="btn" data-all="0">Collapse all</button></div>';

    track.sections.forEach(function (sec) {
      var groups = sec.g.map(function (g) {
        var items = g.i.map(function (label) {
          return INDEX.find(function (x) {
            return x.track === track.id && x.sec === sec.n && x.label === label;
          });
        }).filter(function (x) {
          if (!x) return false;
          if (q && x.label.toLowerCase().indexOf(q) === -1) return false;
          if (FILTER === "done" && !S.checked[x.id]) return false;
          if (FILTER === "todo" && S.checked[x.id]) return false;
          return true;
        });
        if (!items.length) return "";
        return '<div class="grp-name">' + esc(g.n) + "</div>" +
          '<div class="items">' + items.map(itemRow).join("") + "</div>";
      }).join("");

      if (narrowed && !groups) return;

      var all = INDEX.filter(function (x) { return x.track === track.id && x.sec === sec.n; });
      var done = all.filter(function (x) { return S.checked[x.id]; }).length;
      var pct = all.length ? (done / all.length) * 100 : 0;
      var key = track.id + "|" + sec.n;
      var open = narrowed ? true : !!S.open[key];

      html += '<section class="section' + (open ? " open" : "") + (pct >= 100 ? " done" : "") +
        '" data-key="' + esc(key) + '">' +
        '<button class="sec-head"><span class="chev">▸</span>' +
        '<span class="sec-name">' + esc(sec.n) + "</span>" +
        '<span class="meter"><i style="width:' + pct + '%"></i></span>' +
        '<span class="sec-count">' + done + "/" + all.length + "</span></button>" +
        '<div class="sec-body">' + groups + "</div></section>";
    });

    return html;
  }

  /* The day's three, chosen once and then held.

     They used to be picked fresh on every render from the list of unchecked
     topics. The date seed made that look stable, but the pool it indexed
     into shrank the moment you ticked one -- so `seed % pending.length`
     landed somewhere else and all three were replaced. Ticking one item
     appeared to wipe the card.

     Storing the chosen ids for the day fixes both halves: the other two stay
     put, and the one you ticked stays on screen with a line through it,
     which is the part that makes it feel like progress. */
  function dailyThree() {
    var t = today();
    if (S.quest && S.quest.date === t && (S.quest.ids || []).length) {
      return S.quest.ids
        .map(function (id) {
          return RATED.find(function (x) { return x.id === id; });
        })
        .filter(Boolean);
    }

    var pending = RATED.filter(function (x) { return !S.checked[x.id]; });
    var seed = 0;
    for (var i = 0; i < t.length; i++) seed = (seed * 31 + t.charCodeAt(i)) >>> 0;

    var picked = [], seen = {}, tries = 0;
    while (picked.length < 3 && pending.length && tries < 40) {
      tries++;
      seed = (seed * 1103515245 + 12345) >>> 0;
      var cand = pending[seed % pending.length];
      if (cand && !seen[cand.id]) { seen[cand.id] = 1; picked.push(cand); }
    }

    S.quest = { date: t, ids: picked.map(function (x) { return x.id; }) };
    save();
    return picked;
  }

  function renderOverview() {
    var st = stats();
    var ws = windowStats();

    var quests = dailyThree();
    var questsDone = quests.length && quests.every(function (x) { return S.checked[x.id]; });

    var heat = [];
    for (var d = 35; d >= 0; d--) {
      var day = new Date();
      day.setDate(day.getDate() - d);
      heat.push('<i class="' + (S.days.indexOf(dateStr(day)) !== -1 ? "on" : "") + '"></i>');
    }

    var upcoming = spine(6);

    return '<div class="cols"><div>' +
      '<div class="card"><h3>Today’s three</h3>' +
      (quests.length
        ? '<ul class="quests">' + quests.map(function (x) {
            return '<li data-id="' + x.id + '" class="' + (S.checked[x.id] ? "on" : "") + '">' +
              '<span class="box"></span><span><span class="qtxt">' + esc(x.label) + "</span>" +
              '<span class="qtag">' + esc(x.sec) + "</span></span></li>";
          }).join("") +
          "</ul>" +
          (questsDone
            ? '<div class="quest-done">All three done. ' +
              '<button class="btn tiny" data-newquest="1">Draw three more</button></div>'
            : "")
        : '<div class="empty">Everything cleared.</div>') +
      "</div>" +

      '<div class="card"><h3>Track progress</h3>' +
      PL.tracks.map(function (tr) {
        var pc = st.trackPct(tr.id);
        return '<div class="bar-row"><span class="nm">' + esc(tr.label) +
          (tr.rated ? "" : " <span style=\"opacity:.6\">(unrated)</span>") + "</span>" +
          '<span class="bar"><i style="width:' + pc + '%"></i></span>' +
          '<span class="pc">' + Math.round(pc) + "%</span></div>";
      }).join("") + "</div>" +

      "</div><div>" +

      '<div class="card"><h3>Next windows</h3>' +
      (upcoming.length
        ? upcoming.map(function (s) {
            var dd = daysUntil(s.date);
            return '<div class="bar-row"><span class="nm">' + esc(s.label) + "</span>" +
              '<span class="pc mono ' + level(dd) + '" style="width:auto">' + tminus(dd) + "</span></div>";
          }).join("")
        : '<div class="empty">Nothing dated is open.</div>') +
      "</div>" +

      '<div class="card"><h3>Last 36 days</h3><div class="heat">' + heat.join("") + "</div>" +
      '<div class="instr-note" style="margin-top:10px">Streak <b>' + st.streak + "</b> days</div></div>" +

      '<div class="card"><h3>Badges</h3><div class="badges">' +
      PL.badges.map(function (b) {
        var got = S.badges.indexOf(b.id) !== -1;
        return '<div class="badge' + (got ? " on" : "") + '" title="' + esc(b.d) + '">' +
          '<span class="g">' + esc(b.ic) + "</span>" + esc(b.n) + "</div>";
      }).join("") + "</div></div>" +

      "</div></div>";
  }

  var TAG_LABELS = {
    confirmed: ["confirmed", "Confirmed date"],
    projected: ["projected", "Projected — verify"],
    oneshot: ["oneshot", "One shot only"],
    verify: ["verify", "Verification task"],
    action: ["", "Action"]
  };

  function mbaRow(m) {
    var it = m.item;
    var dd = it.date ? daysUntil(it.date) : null;
    var lv = level(dd);
    var on = !!S.mba[it.id];
    var tags = (it.tags || []).map(function (tg) {
      var known = TAG_LABELS[tg];
      // A tag outside this fixed set -- one added through the edit panel
      // below, or an assistant's add_mba_tags -- still gets a pill, just
      // an unstyled one showing its own text. Dropping it silently would
      // mean "add a tag" stored the tag and then showed nothing.
      if (known) return '<span class="tag ' + known[0] + '">' + known[1] + "</span>";
      return '<span class="tag">' + esc(tg) + "</span>";
    }).join("");

    var custom = it.source === "custom";
    var editTags = (it.tags || []).map(function (tg) {
      var label = TAG_LABELS[tg] ? TAG_LABELS[tg][1] : tg;
      return '<button type="button" class="tag x-tag" data-mba-tagdel="' +
        esc(it.id) + "::" + esc(tg) + '">' + esc(label) + " ✕</button>";
    }).join("");
    var editActions = m.excluded
      ? '<button type="button" class="btn tiny" data-mba-restore="' + esc(it.id) + '">Restore</button>' +
        (custom
          ? '<button type="button" class="btn tiny danger" data-mba-forcedelete="' + esc(it.id) +
            '">Delete forever</button>'
          : "")
      : '<button type="button" class="btn tiny danger" data-mba-hide="' + esc(it.id) + '">' +
        (custom ? "Delete" : "Hide") + "</button>";

    /* Stamped so filtering can hide rows in place rather than re-rendering
       the tab. Re-rendering on every keystroke would blow away the search
       box the keystroke was typed into. */
    var haystack = ((it.task || "") + " " + (it.note || "") + " " +
                    (it.phase || m.phase || "")).toLowerCase();
    return '<div class="mba-item" data-task="' + esc(haystack) +
      '" data-tags="' + esc((it.tags || []).join("|").toLowerCase()) +
      '" data-done="' + (on ? "1" : "0") + '">' +
      '<div class="row ' + lv + (on ? " on" : "") + '" data-mba="' + esc(it.id) + '">' +
      '<span class="box"></span><div class="rbody">' +
      '<div class="rtask">' + esc(it.task) + "</div>" +
      (it.note ? '<div class="rnote">' + esc(it.note) + "</div>" : "") +
      '<div class="rmeta">' +
      (it.date ? '<span class="rdate">' + fmtDate(it.date) + "</span>" +
        '<span class="rt ' + lv + '">' + tminus(dd) + "</span>" : '<span class="rt cool">NO DATE</span>') +
      tags + "</div></div></div>" +
      '<details class="mba-edit"><summary>Edit</summary><div class="edit-body">' +
      (editTags || '<span class="muted tiny">No tags yet.</span>') +
      '<div class="edit-row">' +
      '<input type="text" class="edit-tag-input" placeholder="add a tag" maxlength="40" data-mba-taginput="' +
        esc(it.id) + '">' +
      '<button type="button" class="btn tiny" data-mba-addtag="' + esc(it.id) + '">Add tag</button>' +
      "</div>" +
      '<div class="edit-row">' + editActions + "</div>" +
      "</div></details></div>";
  }

  /* Filter state for the MBA tab. Held here rather than in the URL or in S
     because it is a way of looking at the list, not a change to it -- the
     next visit should start from the whole list, the same way it always has.
     Tags match case-insensitively, since a tag is free text and "Round 1"
     and "round 1" are the same tag everywhere else. */
  var MBAF = { q: "", tags: [], hideDone: false };

  function mbaAllTags() {
    var seen = {};
    var out = [];
    function take(it) {
      (it.tags || []).forEach(function (t) {
        var key = String(t).trim().toLowerCase();
        if (!key || seen[key]) return;
        seen[key] = 1;
        out.push({ key: key, label: TAG_LABELS[t] ? TAG_LABELS[t][1] : t });
      });
    }
    (MBA.phases || []).forEach(function (p) { (p.items || []).forEach(take); });
    (MBA.excluded || []).forEach(take);
    out.sort(function (a, b) { return a.label.localeCompare(b.label); });
    return out;
  }

  function mbaFilterBar() {
    var chips = mbaAllTags().map(function (t) {
      var on = MBAF.tags.indexOf(t.key) !== -1;
      return '<button type="button" class="tag mba-f' + (on ? " on" : "") +
        '" data-mbafilter="' + esc(t.key) + '">' + esc(t.label) + "</button>";
    }).join("");
    if (!chips) chips = '<span class="muted tiny">No tags on anything yet.</span>';

    return '<div class="card mba-filter">' +
      '<div class="edit-row">' +
      '<input type="search" id="mbaSearch" placeholder="Search the MBA list" ' +
      'value="' + esc(MBAF.q) + '">' +
      '<label class="switch"><input type="checkbox" id="mbaHideDone"' +
      (MBAF.hideDone ? " checked" : "") + "><span>Hide done</span></label>" +
      '<button type="button" class="btn tiny" id="mbaClearFilter">Clear</button>' +
      "</div>" +
      '<div class="chips mba-filter-tags">' + chips + "</div>" +
      '<div class="muted tiny" id="mbaFilterCount"></div>' +
      "</div>";
  }

  /* Hides rows in place. A phase whose every item is filtered out is hidden
     too, rather than left as an empty heading -- an empty PHASE 03 reads as
     "nothing here", which is a different claim from "nothing here matches". */
  function applyMbaFilter() {
    var panel = document.getElementById("panel");
    if (!panel) return;
    var q = MBAF.q.trim().toLowerCase();
    var shown = 0, total = 0;

    panel.querySelectorAll(".mba-item").forEach(function (row) {
      total++;
      var tags = (row.dataset.tags || "").split("|").filter(Boolean);
      var ok =
        (!q || (row.dataset.task || "").indexOf(q) !== -1 ||
          tags.some(function (t) { return t.indexOf(q) !== -1; })) &&
        (!MBAF.hideDone || row.dataset.done !== "1") &&
        MBAF.tags.every(function (want) { return tags.indexOf(want) !== -1; });
      row.hidden = !ok;
      if (ok) shown++;
    });

    panel.querySelectorAll("section.phase").forEach(function (sec) {
      var items = sec.querySelectorAll(".mba-item");
      if (!items.length) return;   // the schools grid has no items to filter
      var any = [...items].some(function (r) { return !r.hidden; });
      sec.hidden = !any;
    });

    var note = document.getElementById("mbaFilterCount");
    if (note) {
      var filtering = q || MBAF.hideDone || MBAF.tags.length;
      note.textContent = filtering ? shown + " of " + total + " shown" : "";
    }
  }

  function renderMba() {
    var ws = windowStats();
    var html = "";

    if (ws.oneshotMissed) {
      html += '<div class="callout" style="border-left-color:var(--crit)">' +
        "<h3>" + ws.oneshotMissed + " one-shot window closed</h3>" +
        "<p>These programmes do not accept reapplication in a later cycle. " +
        "Window integrity does not recover from this, by design.</p></div>";
    }

    html += '<div class="callout"><h3>The Ivy League is not the elite MBA set</h3>' +
      "<p>Princeton awards no MBA. Brown has no business school, only a 15 month executive " +
      "programme run with IE Madrid. Cornell and Tuck sit outside the top ten. Filtering on " +
      "the Ivy League literally would have cut Stanford GSB, MIT Sloan, Chicago Booth and " +
      "Berkeley Haas, which are four of the five strongest entrepreneurship schools in the US. " +
      "The target set is M7 plus Berkeley Haas, plus Yale and IESE for structural reasons.</p></div>";

    html += mbaFilterBar();

    html += '<details class="card mba-add"><summary>+ Add an MBA item</summary>' +
      '<div class="edit-body">' +
      '<input type="text" id="mbaNewTask" placeholder="What needs doing" maxlength="300">' +
      '<div class="edit-row">' +
      '<input type="date" id="mbaNewDate">' +
      '<input type="text" id="mbaNewPhase" placeholder="Phase (optional)" maxlength="60">' +
      "</div>" +
      '<input type="text" id="mbaNewTags" placeholder="Tags, comma separated (optional)">' +
      '<div class="edit-row"><button type="button" class="btn primary tiny" id="mbaNewSubmit">Add</button></div>' +
      "</div></details>";

    MBA.phases.forEach(function (p) {
      html += '<section class="phase"><div class="phase-hd">' +
        '<span class="phase-n">' + esc(p.n) + "</span>" +
        "<h2>" + esc(p.t) + "</h2>" +
        '<span class="phase-when">' + esc(p.when) + "</span></div>" +
        (p.items || []).map(function (it) {
          return mbaRow({ item: it, phase: p.n });
        }).join("") + "</section>";
    });

    html += '<section class="phase"><div class="phase-hd">' +
      '<span class="phase-n">TARGETS</span><h2>The window map</h2>' +
      '<span class="phase-when">Ranked by founder fit</span></div>' +
      '<div class="grid" style="padding:14px 16px">' +
      MBA.schools.map(function (s) {
        var chips = "";
        if (s.ivy) chips += '<span class="tag">Ivy</span>';
        if (s.m7) chips += '<span class="tag confirmed">M7</span>';
        chips += '<span class="tag' + (s.fit === "a" ? " oneshot" : "") + '">' +
          (s.fit === "a" ? "Target" : "Insurance") + "</span>";
        return '<div class="sch"><h3>' + esc(s.n) + "</h3>" +
          '<div class="prog">' + esc(s.p) + "</div>" +
          "<p>" + esc(s.txt) + "</p>" +
          '<div class="chips">' + chips + "</div></div>";
      }).join("") + "</div></section>";

    html += '<section class="phase"><div class="phase-hd">' +
      '<span class="phase-n">EXCLUDED</span><h2>Decided against, on purpose</h2>' +
      '<span class="phase-when">So it is a choice, not an oversight</span></div>' +
      (MBA.excluded || []).map(function (it) {
        return mbaRow({ item: it, phase: "EXCLUDED", excluded: true });
      }).join("") + "</section>";

    return html;
  }

  var OPP_STATUSES = ["new", "interested", "applied", "shortlisted", "rejected", "offer", "dropped"];
  /* Closed outcomes. Still listed, because "I applied and was rejected" is
     worth keeping, but they stop counting towards the tab badge -- a number
     that includes things you have finished with is not a to-do count. */
  var OPP_CLOSED = ["rejected", "dropped", "offer"];

  function oppStatus(o) {
    return (S.opps[o.id] && S.opps[o.id].status) || (o.user && o.user.status) || "new";
  }
  function liveOpps() {
    return OPPS.filter(function (o) { return OPP_CLOSED.indexOf(oppStatus(o)) === -1; });
  }

  /* The add form. Same idiom as the MBA tab's manual editor, and the same
     reasoning: a tab that can only be filled by something else is a tab
     that goes stale the moment that something else stops running -- which
     is exactly what happened when the inbox agent was retired. */
  function careerEditor() {
    return '<section class="card prop-manual"><h3>Add an opportunity</h3>' +
      '<p class="muted">Anything you spot yourself: a notice on a board, a forward, ' +
      "a mail you read before the agent ever would have.</p>" +
      '<div class="edit-body">' +
        '<div class="edit-row">' +
          '<input type="text" id="oppCompany" placeholder="Company" maxlength="120">' +
          '<input type="text" id="oppRole" placeholder="Role" maxlength="160">' +
        "</div>" +
        '<div class="edit-row">' +
          '<input type="date" id="oppDeadline">' +
          '<input type="text" id="oppLocation" placeholder="Location" maxlength="80">' +
          '<input type="text" id="oppStipend" placeholder="Stipend" maxlength="80">' +
        "</div>" +
        '<input type="url" id="oppUrl" placeholder="Application link (optional)" maxlength="500">' +
        '<input type="text" id="oppSummary" placeholder="Anything worth remembering (optional)" maxlength="600">' +
        '<div class="agent-actions">' +
          '<button class="btn primary" id="oppAdd" type="button">Add opportunity</button>' +
          '<span class="muted" id="oppMsg"></span>' +
        "</div>" +
      "</div></section>";
  }

  function renderCareer() {
    if (!OPPS.length) {
      return '<div class="empty">Nothing here yet.<br><br>' +
        "This tab used to fill itself from the inbox agent. The agent is retired, so it is " +
        "yours to keep now — add anything worth tracking and it stays in the countdown spine " +
        "with everything else.</div>" + careerEditor();
    }

    var sorted = OPPS.slice().sort(function (a, b) {
      return (a.deadline || "9999") < (b.deadline || "9999") ? -1 : 1;
    });

    return sorted.map(function (o) {
      var status = oppStatus(o);
      var closed = OPP_CLOSED.indexOf(status) !== -1;
      var dd = o.deadline ? daysUntil(o.deadline) : null;
      return '<div class="opp' + (closed ? " closed" : "") + '"><div class="opp-hd">' +
        '<span class="opp-co">' + esc(o.company || "Unknown") + "</span>" +
        '<span class="opp-role">' + esc(o.role || o.kind || "") + "</span>" +
        (o.deadline ? '<span class="rt ' + level(dd) + '">' + tminus(dd) + "</span>" : "") +
        "</div>" +
        (o.summary ? '<div class="rnote">' + esc(o.summary) + "</div>" : "") +
        '<div class="opp-meta">' +
        '<select data-opp="' + esc(o.id) + '">' +
        OPP_STATUSES.map(function (s) {
          return '<option value="' + s + '"' + (s === status ? " selected" : "") + ">" + s + "</option>";
        }).join("") + "</select>" +
        (o.deadline ? '<span class="rdate">' + fmtDate(o.deadline) + "</span>" : "") +
        (o.location ? '<span class="tag">' + esc(o.location) + "</span>" : "") +
        (o.stipend ? '<span class="tag">' + esc(o.stipend) + "</span>" : "") +
        (o.apply_url ? ' <a class="tag" href="' + esc(o.apply_url) + '" target="_blank" rel="noopener noreferrer">Apply</a>' : "") +
        (o.source && o.source.gmail_url
          ? ' <a class="tag" href="' + esc(o.source.gmail_url) + '" target="_blank" rel="noopener noreferrer">Mail</a>'
          : "") +
        // Only what you added by hand can be deleted. The agent's archived
        // finds stay: they are a record of what was going on at the time,
        // and nothing will ever write them again.
        (o.origin === "manual"
          ? ' <button class="btn tiny danger" data-oppdel="' + esc(o.id) + '">Delete</button>'
          : "") +
        "</div></div>";
    }).join("") + careerEditor();
  }

  /* ---------------------------------------------------------- render */

  var CF_TIMERS = false;

  function render() {
    var mine = sectionTabs();
    var tab = mine.find(function (t) { return t.id === ACTIVE; }) || mine[0];
    ACTIVE = tab.id;
    document.body.classList.toggle("domain-mba", tab.domain === "mba");
    document.body.classList.toggle("domain-dsa", tab.domain === "dsa");

    var panel = document.getElementById("panel");
    if (tab.id === "overview") panel.innerHTML = renderOverview();
    else if (tab.id === "mba") panel.innerHTML = renderMba();
    else if (tab.id === "career") panel.innerHTML = renderCareer();
    else if (tab.id === "dsa-today") panel.innerHTML = renderDsaToday();
    else if (tab.id === "dsa-plan") panel.innerHTML = renderDsaPlan();
    else if (tab.id === "dsa-browse") panel.innerHTML = renderDsaBrowse();
    else if (tab.id === "dsa-revision") panel.innerHTML = renderDsaRevision();
    else if (tab.id === "dsa-theory") panel.innerHTML = renderDsaTheory();
    else if (tab.id === "dsa-oa") panel.innerHTML = renderDsaOa();
    else panel.innerHTML = renderTrack(tab.track);

    renderHeader();
    loadCF(false);
    /* The server caches for an hour, so asking more often than that is free
       and just keeps the contest countdown honest. Started once, not on
       every render -- render() runs on every tab switch and every tick, so
       this was adding two more timers each time and never clearing any. */
    if (!CF_TIMERS) {
      CF_TIMERS = true;
      setInterval(function () { loadCF(false); }, 5 * 60 * 1000);
      setInterval(renderCF, 60 * 1000);
    }
    renderSections();
    renderTabs();
    bind();
    if (tab.domain === "dsa") {
      bindDsa();
      if (tab.id === "dsa-theory" && DSAV.theory) dsaFillTheory();
      if (tab.id === "dsa-today") dsaMaybeKeep();
      if (tab.id === "dsa-oa") {
        bindOa();
        // The list is the only OA screen that paints before its fetch.
        if (OAV.view === "list" && !OAV.list && !OAV.error) oaLoadList();
      } else {
        // Leaving the tab stops the countdown repainting an element that
        // is no longer on the page. The attempt itself keeps running --
        // the clock belongs to the server, not to this interval.
        oaStopTimer();
      }
      /* A repaint puts an expanded row's detail div back empty, so anything
         still open has to be refilled. Cached after the first fetch, so this
         is a dictionary lookup rather than a request. */
      if (DSAV.openId) dsaFillDetail(DSAV.openId);
    }
  }

  /* The streak counts days you actually moved something, so reverting the
     last tick of the day has to give the day back. That needs a per-day
     count -- a bare list of dates cannot tell "ticked three, untick one"
     from "ticked one, untick it". */
  function markToday(delta) {
    var t = today();
    var counts = S.dayCount || (S.dayCount = {});
    if (counts[t] === undefined) {
      // Days recorded before counts existed are worth at least one tick.
      counts[t] = S.days.indexOf(t) !== -1 ? 1 : 0;
    }
    counts[t] = Math.max(0, counts[t] + (delta === undefined ? 1 : delta));

    var at = S.days.indexOf(t);
    if (counts[t] > 0 && at === -1) S.days.push(t);
    if (counts[t] === 0 && at !== -1) S.days.splice(at, 1);
  }

  function afterChange(delta) {
    markToday(delta);
    var gained = refreshBadges(stats());
    save();
    render();
    if (gained.length) toast("Badge unlocked: " + gained[0].n);
  }

  function bind() {
    // topic checkboxes
    document.querySelectorAll('.item input[data-id]').forEach(function (input) {
      input.onchange = function () {
        var id = input.dataset.id;
        if (input.checked) S.checked[id] = 1; else delete S.checked[id];
        afterChange(input.checked ? 1 : -1);
      };
    });

    // daily quests
    document.querySelectorAll(".quests li[data-id]").forEach(function (li) {
      li.onclick = function () {
        var id = li.dataset.id;
        var nowOn = !S.checked[id];
        if (nowOn) S.checked[id] = 1; else delete S.checked[id];
        afterChange(nowOn ? 1 : -1);
      };
    });

    // MBA rows
    document.querySelectorAll(".row[data-mba]").forEach(function (row) {
      row.onclick = function () {
        var id = row.dataset.mba;
        var nowOn = !S.mba[id];
        if (nowOn) S.mba[id] = 1; else delete S.mba[id];
        markToday(nowOn ? 1 : -1);
        save();
        render();
      };
    });

    /* --- MBA filtering ------------------------------------------------
       Every handler here edits MBAF and calls applyMbaFilter(), never
       render(): re-rendering the tab would replace the search box mid-word
       and drop the caret. The chips do re-render, but only their own bar. */
    var mbaSearch = document.getElementById("mbaSearch");
    if (mbaSearch) {
      mbaSearch.oninput = function () { MBAF.q = mbaSearch.value; applyMbaFilter(); };
    }
    var mbaHideDone = document.getElementById("mbaHideDone");
    if (mbaHideDone) {
      mbaHideDone.onchange = function () {
        MBAF.hideDone = mbaHideDone.checked;
        applyMbaFilter();
      };
    }
    var mbaClear = document.getElementById("mbaClearFilter");
    if (mbaClear) {
      mbaClear.onclick = function () {
        MBAF = { q: "", tags: [], hideDone: false };
        if (mbaSearch) mbaSearch.value = "";
        if (mbaHideDone) mbaHideDone.checked = false;
        document.querySelectorAll("[data-mbafilter]").forEach(function (b) {
          b.classList.remove("on");
        });
        applyMbaFilter();
      };
    }
    document.querySelectorAll("[data-mbafilter]").forEach(function (b) {
      b.onclick = function () {
        var key = b.dataset.mbafilter;
        var at = MBAF.tags.indexOf(key);
        if (at === -1) MBAF.tags.push(key);
        else MBAF.tags.splice(at, 1);
        b.classList.toggle("on", at === -1);
        applyMbaFilter();
      };
    });
    if (document.querySelector(".mba-filter")) applyMbaFilter();

    // MBA manual editing -- add/remove tags, hide or delete an item,
    // restore one out of EXCLUDED, and the "+ Add an MBA item" form. Every
    // action here writes through the API and then refetches the delta
    // (refreshMbaCustom), rather than patching MBA locally, so this view
    // always ends up agreeing with whatever an assistant or another tab
    // did in the meantime.
    document.querySelectorAll("[data-mba-tagdel]").forEach(function (b) {
      b.onclick = function () {
        /* Split on the FIRST separator only. A tag is free text now, so
           splitting on every "::" would truncate one that contained it --
           and the server refuses that character for the same reason. */
        var packed = b.dataset.mbaTagdel;
        var cut = packed.indexOf("::");
        var id = packed.slice(0, cut);
        var tag = packed.slice(cut + 2);
        b.disabled = true;
        api("/api/mba/tags/remove", { method: "POST", body: JSON.stringify({ id: id, tags: [tag] }) })
          .then(function () { refreshMbaCustom(); })
          .catch(function (e) { toast("Could not remove the tag: " + e.message); b.disabled = false; });
      };
    });

    document.querySelectorAll("[data-mba-addtag]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.mbaAddtag;
        var input = document.querySelector('[data-mba-taginput="' + id + '"]');
        /* Typed as typed. Lowercasing here is what made "Action Required"
           into a tag the old validator rejected anyway, and it did not match
           the curriculum's own "Confirmed date" either. */
        var tag = (input.value || "").trim();
        if (!tag) return;
        b.disabled = true;
        api("/api/mba/tags", { method: "POST", body: JSON.stringify({ id: id, tags: [tag] }) })
          .then(function (r) {
            if (r && r.rejected && r.rejected.length) toast("Not saved: " + r.rejected.join("; "));
            refreshMbaCustom();
          })
          .catch(function (e) { toast("Could not add the tag: " + e.message); b.disabled = false; });
      };
      var input = document.querySelector('[data-mba-taginput="' + b.dataset.mbaAddtag + '"]');
      if (input) input.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); b.click(); } };
    });

    document.querySelectorAll("[data-mba-hide]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.mbaHide;
        b.disabled = true;
        api("/api/mba/delete", { method: "POST", body: JSON.stringify({ id: id }) })
          .then(function (r) {
            toast(r.deleted ? "Deleted." : "Hidden — Restore brings it back.");
            refreshMbaCustom();
          })
          .catch(function (e) { toast("Could not remove it: " + e.message); b.disabled = false; });
      };
    });

    document.querySelectorAll("[data-mba-restore]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.mbaRestore;
        b.disabled = true;
        api("/api/mba/exclude", { method: "POST", body: JSON.stringify({ id: id, excluded: false }) })
          .then(function () { refreshMbaCustom(); })
          .catch(function (e) { toast("Could not restore it: " + e.message); b.disabled = false; });
      };
    });

    document.querySelectorAll("[data-mba-forcedelete]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.mbaForcedelete;
        if (!confirm("Delete this for good? This cannot be undone.")) return;
        b.disabled = true;
        api("/api/mba/delete", { method: "POST", body: JSON.stringify({ id: id }) })
          .then(function () { refreshMbaCustom(); })
          .catch(function (e) { toast("Could not delete it: " + e.message); b.disabled = false; });
      };
    });

    var mbaSubmit = document.getElementById("mbaNewSubmit");
    if (mbaSubmit) mbaSubmit.onclick = function () {
      var task = (document.getElementById("mbaNewTask").value || "").trim();
      if (!task) { toast("Say what needs doing first."); return; }
      var tags = (document.getElementById("mbaNewTags").value || "")
        .split(",").map(function (t) { return t.trim(); }).filter(Boolean);
      mbaSubmit.disabled = true;
      api("/api/mba/create", {
        method: "POST",
        body: JSON.stringify({
          task: task,
          date: document.getElementById("mbaNewDate").value || "",
          phase: (document.getElementById("mbaNewPhase").value || "").trim(),
          tags: tags
        })
      })
        .then(function (r) {
          toast(r && r.rejected && r.rejected.length
            ? "Added, but these tags were not saved: " + r.rejected.join("; ")
            : "Added.");
          refreshMbaCustom();
        })
        .catch(function (e) { toast("Could not add it: " + e.message); mbaSubmit.disabled = false; });
    };

    var oppAdd = document.getElementById("oppAdd");
    if (oppAdd) {
      oppAdd.onclick = function () {
        var val = function (id) {
          var el = document.getElementById(id);
          return el ? el.value.trim() : "";
        };
        var payload = {
          company: val("oppCompany"), role: val("oppRole"), deadline: val("oppDeadline"),
          location: val("oppLocation"), stipend: val("oppStipend"),
          apply_url: val("oppUrl"), summary: val("oppSummary")
        };
        if (!payload.company && !payload.role) {
          toast("Give at least a company or a role.");
          return;
        }
        oppAdd.disabled = true;
        api("/api/opportunities", { method: "POST", body: JSON.stringify(payload) })
          .then(function () {
            toast("Added.");
            // Re-fetch rather than splicing locally: the server is the one
            // place the list is reconciled, so this is the only way a
            // second tab is guaranteed to agree with this one.
            return refreshOpportunities();
          })
          .catch(function (e) {
            toast("Could not add it: " + e.message);
            oppAdd.disabled = false;
          });
      };
    }

    document.querySelectorAll("[data-oppdel]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.oppdel;
        b.disabled = true;
        api("/api/opportunities/" + encodeURIComponent(id), { method: "DELETE" })
          .then(function () { toast("Deleted."); return refreshOpportunities(); })
          .catch(function (e) { toast("Could not delete: " + e.message); b.disabled = false; });
      };
    });

    // opportunity status
    document.querySelectorAll("select[data-opp]").forEach(function (sel) {
      sel.onchange = function () {
        var id = sel.dataset.opp;
        S.opps[id] = S.opps[id] || {};
        S.opps[id].status = sel.value;
        save();
        toast("Marked " + sel.value);
      };
    });

    // Collapsible content blocks inside a track. These are .section, NOT the
    // .seg top-level nav buttons -- distinct things that briefly shared a
    // class name.
    document.querySelectorAll("section.section").forEach(function (sec) {
      var head = sec.querySelector(".sec-head");
      if (!head) return;
      head.onclick = function () {
        var key = sec.dataset.key;
        S.open[key] = !S.open[key];
        sec.classList.toggle("open");
        save();
      };
    });

    // All / To do / Done. Re-render only the panel so the toolbar does not
    // jump under the pointer.
    document.querySelectorAll(".btn[data-filter]").forEach(function (b) {
      b.onclick = function () {
        FILTER = b.dataset.filter;
        render();
      };
    });

    document.querySelectorAll("[data-newquest]").forEach(function (b) {
      b.onclick = function () {
        S.quest = {};
        save();
        render();
      };
    });

    document.querySelectorAll(".btn[data-all]").forEach(function (b) {
      b.onclick = function () {
        var open = b.dataset.all === "1";
        document.querySelectorAll("section.section").forEach(function (sec) {
          S.open[sec.dataset.key] = open;
          sec.classList.toggle("open", open);
        });
        save();
      };
    });

    var search = document.getElementById("search");
    if (search) {
      search.oninput = function () {
        QUERY = search.value;
        var tab = TABS.find(function (t) { return t.id === ACTIVE; });
        document.getElementById("panel").innerHTML = renderTrack(tab.track);
        bind();
        var s2 = document.getElementById("search");
        if (s2) { s2.focus(); s2.setSelectionRange(s2.value.length, s2.value.length); }
      };
    }
  }

  /* ============================================================ DSA plan

     The 30-day plan (PRD-v3). A section of its own, not a placement track:
     problems carry a role, a nine-stage thinking pipeline, theory deep links,
     siblings and a stuck ladder, and the user writes status, confidence,
     approach, pseudocode and notes against each.

     The day is a calendar date in IST (DSA_CORE, shared with the Worker), not
     "the first unfinished day": Day N is Day N whether or not Day N-1 got
     done, and what did not get done shows up as carried over, never as the
     plan moving. Nothing on this tab can edit the plan.
  ============================================================ */

  var DSAV = {
    day: 0,            // the plan day being viewed; 0 means "today's"
    openId: null,      // one problem row open at a time
    openSib: null,     // one sibling open at a time, inside the Today blocks
    revealed: {},      // stage id -> uncovered, for the open row; reset on open
    cover: false,      // "hide stages 3–5 again" for the open row
    writeOnly: false,  // the ✍️-only view, remembered per browser
    theory: null,      // theory page being read in the Theory tab
    theorySec: null,   // section to scroll to and flash
    theoryQ: "",
    theoryView: "pages",   // pages | patterns
    drawer: null,      // { page, sec } when the side drawer is open
    timers: {},        // problem id -> ms the stuck-ladder timer started
    drillShown: {},    // drill item id -> answer revealed
    help: {},
    tick: null,
    filters: {
      role: "", topic: "", cluster: "", difficulty: "", status: "", content: "",
      pseudocode: "", cut_state: "", confidence: "", tag: "", has_notes: "", q: ""
    }
  };

  /* Fetched content, held for the session. Everything here is a static file
     the build wrote, so a second look costs nothing. */
  var DSA_CACHE = { problem: {}, theory: {}, day: {} };
  var DSA_TINDEX = null;

  /* Relative, not rooted, so the page still resolves them when it is opened
     from a directory rather than a domain root. */
  function dsaGet(kind, id) {
    var store = DSA_CACHE[kind];
    if (store && store[id]) return Promise.resolve(store[id]);
    return fetch("data/dsa/" + kind + "/" + encodeURIComponent(id) + ".json")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (doc) { if (store) store[id] = doc; return doc; });
  }

  function dsaTheoryIndex() {
    if (DSA_TINDEX) return Promise.resolve(DSA_TINDEX);
    return fetch("data/dsa/theory-index.json")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (doc) { DSA_TINDEX = doc; return doc; });
  }

  /* A day file wanted by the current render. Fetched once and repainted on
     arrival; the render that asked for it shows "Loading…" in its place. */
  var DSA_DAY_PENDING = {};
  function dsaDayDoc(n) {
    if (DSA_CACHE.day[n]) return DSA_CACHE.day[n];
    var d = DSA_PLAN.days[n - 1];
    if (!d || d.content !== "ready" || DSA_DAY_PENDING[n]) return null;
    DSA_DAY_PENDING[n] = true;
    dsaGet("day", n).then(function () { if (SECTION === "dsa") render(); })
      .catch(function () { DSA_DAY_PENDING[n] = "failed"; if (SECTION === "dsa") render(); });
    return null;
  }

  /* ------------------------------------------------------ clock

     `?clock=2026-10-18T09:00` fakes the IST wall clock for the whole tab --
     how the acceptance walk-through in PRD §17 is done without waiting for
     the date. Nothing is written differently: the server stamps its own
     dates, so a faked clock only changes what this page shows. */
  var DSA_CLOCK = (function () {
    var m = /[?&]clock=([0-9T:-]+)/.exec(location.search || "");
    if (!m) return 0;
    var t = Date.parse(m[1] + (m[1].length <= 10 ? "T00:00" : "") + ":00+05:30");
    return isNaN(t) ? 0 : t - Date.now();
  })();
  function dsaNow() { return Date.now() + DSA_CLOCK; }
  function dsaToday() { return DSA_CORE.istDate(dsaNow()); }
  function dsaTodayN() { return DSA_PLAN ? DSA_CORE.planDay(DSA_PLAN.start_date, dsaToday()) : 0; }
  function dsaClampDay(n) { return Math.max(1, Math.min(DSA_PLAN.days.length, n)); }
  function dsaDateOf(n) { return DSA_PLAN.days[n - 1].date; }

  var WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function dsaShortDate(iso) {
    var d = new Date(iso + "T00:00:00Z");
    return WEEKDAY[d.getUTCDay()] + " " + d.getUTCDate() + " " + MON[d.getUTCMonth()];
  }

  /* ------------------------------------------------------ markdown

     The content uses most of markdown -- fenced C++, tables, emphasis, code
     spans, lists -- plus two conventions of its own (PRD §5.4):
       - `[[page]]` / `[[page#section]]` are theory deep links;
       - a line starting `✍️ ` is a write-line: something to copy to paper.
     A renderer is a hundred lines; a library is a CDN dependency on a page
     whose point is that it opens from disk. */

  /* Stash marker for text lifted out before escaping and put back after.
     NUL, because it cannot occur in any of the source material. */
  var SENTINEL = "\u0000";

  function dsaTheoryTitle(page, sec) {
    var t = (DSA_INDEX.theory || {})[page];
    if (!t) return titleCase(page);
    return sec ? t.t + " § " + ((t.s || {})[sec] || sec) : t.t;
  }

  function dsaTheoryAttrs(page, sec) {
    return ' href="#dsa/theory/' + esc(page) + (sec ? "/" + esc(sec) : "") + '" data-dsa-th="' + esc(page) + '"' +
      (sec ? ' data-dsa-sec="' + esc(sec) + '"' : "");
  }

  function mdInline(s) {
    // Code spans are stashed first, so nothing below rewrites their insides.
    var spans = [];
    s = String(s).replace(/`([^`]+)`/g, function (m, code) {
      spans.push(code);
      return SENTINEL + (spans.length - 1) + SENTINEL;
    });
    s = esc(s);
    s = s.replace(/\[\[([a-z0-9-]+)(?:#([a-z0-9_-]+))?\]\]/g, function (m, page, sec) {
      return '<a class="dsa-ilink"' + dsaTheoryAttrs(page, sec) + ">" + esc(dsaTheoryTitle(page, sec)) + "</a>";
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>");
    s = s.replace(new RegExp(SENTINEL + "(\\d+)" + SENTINEL, "g"), function (m, i) {
      return "<code>" + esc(spans[+i]) + "</code>";
    });
    return s;
  }

  /* C++ keyword colouring. A regex pass, not a parser: it runs over already
     escaped text and only ever wraps spans, so the worst a miss can do is
     leave a token uncoloured. */
  var CPP_KW = /\b(alignas|auto|bool|break|case|catch|char|class|const|constexpr|continue|default|delete|do|double|else|enum|explicit|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|return|short|signed|sizeof|static|struct|switch|template|this|throw|true|try|typedef|typename|union|unsigned|using|virtual|void|volatile|while|size_t|uint64_t|int64_t|uint32_t|string|vector|map|set|pair|queue|stack|priority_queue|unordered_map|unordered_set|deque|array|tuple|greater|less|function)\b/g;

  /* Comments, strings and preprocessor lines are matched first and the
     colouring is applied only to the gaps between them, so a keyword inside
     a comment stays a comment. Done by scanning rather than placeholders: a
     numeric placeholder gets eaten by the number rule. */
  var CPP_SKIP = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|&quot;(?:[^&\\]|\\.)*?&quot;|&#39;(?:[^&\\]|\\.)*?&#39;|^[ \t]*#\w+[^\n]*)/gm;

  function cppTokens(s) {
    return s.replace(CPP_KW, '<span class="c-kw">$1</span>')
      .replace(/\b(\d[\w.']*)\b/g, '<span class="c-num">$1</span>');
  }

  function highlightCpp(code) {
    var src = esc(code);
    var out = "";
    var last = 0;
    var m;
    CPP_SKIP.lastIndex = 0;
    while ((m = CPP_SKIP.exec(src)) !== null) {
      out += cppTokens(src.slice(last, m.index));
      var tok = m[0];
      var cls = tok.charAt(0) === "/" ? "c-com" : tok.charAt(0) === "&" ? "c-str" : "c-pre";
      out += '<span class="' + cls + '">' + tok + "</span>";
      last = m.index + tok.length;
      if (m.index === CPP_SKIP.lastIndex) CPP_SKIP.lastIndex++;
    }
    return out + cppTokens(src.slice(last));
  }

  var dsaCodeSeq = 0;

  function mdCode(code, lang) {
    var id = "dsacode" + (++dsaCodeSeq);
    var body = !lang || /^(cpp|c\+\+|c)$/i.test(lang) ? highlightCpp(code) : esc(code);
    return '<div class="dsa-code"><button class="dsa-copy" data-copy="' + id +
      '" type="button">copy</button><pre id="' + id + '"><code>' + body + "</code></pre></div>";
  }

  var WRITE_MARK = /^\s*✍️\s?/;

  /* `opts.wl` -- how write-lines render: "mark" (a mixed section: the line is
     tagged, everything else is screenshot material) or "plain" (a write
     section: every line is a write-line, so tagging each one is noise).
     Either way a write-line is its own paragraph -- the source puts one
     thought per line, and joining them would undo that. */
  function md(text, opts) {
    var wl = (opts && opts.wl) || "";
    var lines = String(text == null ? "" : text).replace(/\r/g, "").split("\n");
    var out = [];
    var para = [];
    var list = null;   // 'ul' | 'ol'
    var items = [];

    function flushPara() {
      if (!para.length) return;
      out.push("<p>" + mdInline(para.join(" ")) + "</p>");
      para = [];
    }
    function flushList() {
      if (!list) return;
      out.push("<" + list + ">" + items.map(function (i) {
        return "<li>" + mdInline(i) + "</li>";
      }).join("") + "</" + list + ">");
      list = null;
      items = [];
    }
    function flush() { flushPara(); flushList(); }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      var fence = line.match(/^\s*```(\w*)\s*$/);
      if (fence) {
        flush();
        var buf = [];
        i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) buf.push(lines[i++]);
        out.push(mdCode(buf.join("\n"), fence[1]));
        continue;
      }

      if (WRITE_MARK.test(line)) {
        flush();
        out.push('<p class="' + (wl === "mark" ? "wl" : "wp") + '">' + mdInline(line.replace(WRITE_MARK, "")) + "</p>");
        continue;
      }

      // A table is a header row followed by a |---|---| separator.
      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        flush();
        var cells = function (row) {
          return row.trim().replace(/^\||\|$/g, "").split("|").map(function (c) { return c.trim(); });
        };
        var head = cells(line);
        i += 2;
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
        i--;
        out.push('<div class="dsa-tablewrap"><table class="dsa-table"><thead><tr>' +
          head.map(function (h) { return "<th>" + mdInline(h) + "</th>"; }).join("") +
          "</tr></thead><tbody>" +
          rows.map(function (r) {
            return "<tr>" + r.map(function (c) { return "<td>" + mdInline(c) + "</td>"; }).join("") + "</tr>";
          }).join("") + "</tbody></table></div>");
        continue;
      }

      var heading = line.match(/^\s*(#{1,4})\s+(.*)$/);
      if (heading) {
        flush();
        var lvl = Math.min(6, heading[1].length + 2);
        out.push("<h" + lvl + ">" + mdInline(heading[2]) + "</h" + lvl + ">");
        continue;
      }

      var ul = line.match(/^\s*[-*]\s+(.*)$/);
      var ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (ul || ol) {
        flushPara();
        var want = ul ? "ul" : "ol";
        if (list && list !== want) flushList();
        list = want;
        items.push((ul || ol)[1]);
        continue;
      }

      if (!line.trim()) { flush(); continue; }

      if (list && /^\s{2,}\S/.test(line)) {
        items[items.length - 1] += " " + line.trim();
        continue;
      }
      flushList();
      para.push(line.trim());
    }
    flush();
    return out.join("");
  }

  /* A content section -- stage, theory section, micro-theory, CS card -- as
     the ✍️/📸 convention says it should render. In the ✍️-only view a
     screenshot section is dropped entirely and a mixed one keeps only its
     write-lines: what is left is exactly what goes into GoodNotes. */
  var NOTE_BADGE = { write: "✍️", screenshot: "📸", mixed: "✍️ 📸" };
  var NOTE_TITLE = {
    write: "Write this by hand",
    screenshot: "Screenshot this — reading material, not for copying",
    mixed: "Write the ✍️ lines by hand, screenshot the rest"
  };

  function dsaNoteBadge(note) {
    return '<span class="dsa-note n-' + esc(note) + '" title="' + esc(NOTE_TITLE[note] || "") + '">' +
      (NOTE_BADGE[note] || "") + "</span>";
  }

  function dsaSectionBody(section) {
    if (DSAV.writeOnly && section.note === "screenshot") return "";
    var body = section.body;
    if (DSAV.writeOnly && section.note === "mixed") {
      body = body.split("\n").filter(function (l) { return WRITE_MARK.test(l); }).join("\n");
    }
    return md(body, { wl: section.note === "mixed" && !DSAV.writeOnly ? "mark" : "plain" });
  }

  /* ------------------------------------------------------ derived */

  function dsaRole(role) { return (DSA_PLAN.roles || {})[role] || { meaning: "", weight: 10 }; }

  function dsaProblemsOn(day) {
    return DSA_PROBLEMS.filter(function (p) { return p.day === day; })
      .sort(function (a, b) { return a.ord - b.ord; });
  }

  function dsaCluster(key) {
    var cs = DSA_PLAN.clusters || [];
    for (var i = 0; i < cs.length; i++) if (cs[i].key === key) return cs[i];
    return { key: key, title: titleCase(key), days: [] };
  }

  function dsaMockOn(day) {
    var ms = DSA_PLAN.mocks || [];
    for (var i = 0; i < ms.length; i++) if (ms[i].day === day) return ms[i];
    return null;
  }

  /* Runtime state of the mocks (unlock time once revealed, open, missed...),
     from /api/oa/schedule. The dates are baked in; this adds what only the
     server can know. Polled every five minutes while the page is open. */
  var DSA_SCHED = {};
  function dsaAdoptSchedule(list) {
    (list || []).forEach(function (m) { DSA_SCHED[m.id] = m; });
  }
  function dsaLoadSchedule() {
    return api("/api/oa/schedule").then(function (d) {
      dsaAdoptSchedule(d.schedule);
      if (SECTION === "dsa" && ACTIVE === "dsa-today") render();
    }).catch(function () { /* the baked dates still show */ });
  }

  function dsaNextMock(today) {
    var ms = DSA_PLAN.mocks || [];
    for (var i = 0; i < ms.length; i++) if (ms[i].date >= today) return ms[i];
    return null;
  }

  function dsaMockLabel(m) {
    return m.kind === "grand" ? "Grand mock" : "Mock " + m.id.replace(/^mock-/, "");
  }

  /* The floor (PRD §8.2): due re-solves shown that day, plus the day's first
     LEARN problem. Day 11 has no LEARN problem, so its first problem stands
     in -- the floor is "the one thing that keeps the day", and every day has
     a first problem. */
  function dsaFloorProblem(day) {
    var rows = dsaProblemsOn(day);
    for (var i = 0; i < rows.length; i++) if (rows[i].role === "LEARN") return rows[i];
    return rows[0] || null;
  }

  /* The inputs DSA_CORE's day functions take -- the same shape the cron
     builds from D1, so the floor and the re-solve list here are computed by
     the very code that decides whether a nudge or a miss mail goes out. */
  function dsaCtx(day, today) {
    return {
      days: DSA_PLAN.days.map(function (d) {
        return { day: d.day, date: d.date, problems: dsaProblemsOn(d.day).map(function (p) {
          return { id: p.id, ord: p.ord, role: p.role, title: p.title, url: p.url, must: p.must };
        }) };
      }),
      progress: DSA_S.problems, siblings: DSA_S.siblings, drill: DSA_S.drill, ledger: DSA_S.days,
      today: today, todayN: day
    };
  }

  function dsaDueResolves(today) {
    return DSA_CORE.dueResolves(dsaCtx(dsaTodayN(), today)).map(function (p) { return DSA_BY_ID[p.id]; });
  }

  function dsaFloor(day, today) {
    return DSA_CORE.floorStatus(dsaCtx(day, today));
  }

  function isDoneStatus(s) { return DSA_CORE.isDone(s); }

  function dsaDayLedger(day) {
    return DSA_S.days[day] || { kept: false, micro_read: false, cs_core_done: false, note: "" };
  }

  /* Consecutive kept days ending today, or yesterday if today is not kept yet
     -- the streak is not broken until the day is actually over. */
  function dsaStreak(todayN) {
    var n = 0;
    var d = dsaDayLedger(todayN).kept ? todayN : todayN - 1;
    while (d >= 1 && dsaDayLedger(d).kept) { n++; d--; }
    return n;
  }

  function dsaBehind(todayN) {
    return DSA_PROBLEMS.filter(function (p) {
      if (p.day >= todayN) return false;
      var g = dsaRow(p.id);
      return g.status === "todo" && !g.cut_state;
    });
  }

  function dsaCarried(todayN) {
    return dsaBehind(todayN).filter(function (p) {
      return p.role === "LEARN" || p.role === "APPLY";
    }).sort(function (a, b) { return a.day - b.day || a.ord - b.ord; });
  }

  /* Must-study siblings of problems first solved before today and not yet
     studied, oldest first. The PRD shows yesterday's; one you did not get to
     yesterday stays here rather than vanishing, because it is still the one
     sibling the plan says to study. */
  function dsaDueSiblings(today) {
    return DSA_PROBLEMS.filter(function (p) {
      var g = dsaRow(p.id);
      if (!p.must || !g.first_done_at || g.first_done_at >= today) return false;
      return !(DSA_S.siblings[p.must.id] || {}).studied;
    }).sort(function (a, b) {
      return dsaRow(a.id).first_done_at.localeCompare(dsaRow(b.id).first_done_at) || a.day - b.day;
    });
  }

  function dsaStats(rows) {
    var out = { total: rows.length, done: 0, solved: 0, revisit: 0, skimmed: 0, todo: 0, starred: 0 };
    rows.forEach(function (p) {
      var g = dsaRow(p.id);
      if (out[g.status] !== undefined) out[g.status]++;
      if (g.revision) out.starred++;
      if (isDoneStatus(g.status)) out.done++;
    });
    return out;
  }

  var DSA_ACRONYM = { bst: "BST", dp: "DP", stl: "STL", oa: "OA", cpp: "C++", ds: "DS" };

  function titleCase(s) {
    return String(s || "").split("-").map(function (w) {
      return DSA_ACRONYM[w] || (w.charAt(0).toUpperCase() + w.slice(1));
    }).join(" ");
  }

  /* ------------------------------------------------------ row pieces */

  function dsaRoleBadge(role) {
    return '<span class="dsa-role r-' + esc(role) + '" title="' + esc(dsaRole(role).meaning) + '">' + esc(role) + "</span>";
  }

  function dsaDiffBadge(d) {
    return '<span class="dsa-diff d-' + String(d).toLowerCase() + '">' + esc(d) + "</span>";
  }

  function dsaStatusOrder(id) {
    return dsaRow(id).cut_state === "skim" ? ["todo", "skimmed", "solved", "revisit"] : ["todo", "solved", "revisit"];
  }

  function dsaStatusButton(id) {
    var g = dsaRow(id);
    return '<button class="dsa-status s-' + g.status + '" data-dsa-status="' + esc(id) +
      '" type="button" title="Cycle: ' + dsaStatusOrder(id).join(", ") + '">' + g.status + "</button>";
  }

  function dsaStar(id) {
    var on = dsaRow(id).revision;
    return '<button class="dsa-star' + (on ? " on" : "") + '" data-dsa-star="' + esc(id) +
      '" type="button" title="Flag for the revision queue">' + (on ? "★" : "☆") + "</button>";
  }

  function dsaConfidence(id) {
    var g = dsaRow(id);
    var out = '<span class="dsa-conf" title="Confidence. 1 = needed the editorial, 5 = could teach it">';
    for (var n = 1; n <= 5; n++) {
      out += '<button type="button" data-dsa-conf="' + esc(id) + '" data-n="' + n + '"' +
        (g.confidence !== null && n <= g.confidence ? ' class="on"' : "") + ">" + n + "</button>";
    }
    return out + "</span>";
  }

  /* Striver's three links beside the LeetCode one. Missing ones render
     nothing rather than a disabled chip. */
  function dsaStriverLinks(p) {
    var chips = [];
    if (p.tuf_article) chips.push('<a class="dsa-tuf" href="' + esc(p.tuf_article) + '" target="_blank" rel="noopener">TUF editorial</a>');
    if (p.tuf_practice) chips.push('<a class="dsa-tuf prac" href="' + esc(p.tuf_practice) + '" target="_blank" rel="noopener">practice</a>');
    if (p.tuf_youtube) chips.push('<a class="dsa-tuf yt" href="' + esc(p.tuf_youtube) + '" target="_blank" rel="noopener">video</a>');
    return chips.length ? " · " + chips.join(" ") : "";
  }

  function dsaTheoryChip(page, sec, label, why) {
    return '<a class="dsa-chip"' + dsaTheoryAttrs(page, sec) + (why ? ' title="' + esc(why) + '"' : "") + ">" +
      esc(label || dsaTheoryTitle(page, sec)) + "</a>";
  }

  function dsaPrimaryTheory(ids) {
    return (ids || []).map(function (t) { return dsaTheoryChip(t, null); }).join("");
  }

  /* `opts.note` -- a line under the title saying why the row is here
     ("carried over from Day 2", "moved to revision"). */
  function dsaRowEl(p, opts) {
    var o = opts || {};
    var g = dsaRow(p.id);
    var open = DSAV.openId === p.id;
    var unwritten = isDoneStatus(g.status) && !g.my_pseudocode.trim();
    return '<div class="dsa-row st-' + g.status + (open ? " open" : "") + '" data-dsa-row="' + esc(p.id) + '">' +
      '<div class="dsa-rhead">' +
        dsaRoleBadge(p.role) +
        '<a class="dsa-title" href="' + esc(p.url) + '" target="_blank" rel="noopener" title="Open on LeetCode">' +
          esc(p.title) + "</a>" +
        dsaDiffBadge(p.difficulty) +
        (p.campus_oa === "HIGH" ? '<span class="dsa-oa" title="Frequent in campus online assessments">OA</span>' : "") +
        (g.notes ? '<span class="dsa-hasnote" title="You have notes on this">✎</span>' : "") +
        (unwritten ? '<span class="dsa-nopseudo" title="Marked done with no pseudocode written">no pseudocode</span>' : "") +
        '<span class="dsa-actions">' + dsaStatusButton(p.id) + dsaStar(p.id) + dsaConfidence(p.id) +
          '<button class="dsa-expand" data-dsa-open="' + esc(p.id) + '" type="button">' +
          (open ? "collapse" : "open") + "</button></span>" +
      "</div>" +
      (o.note ? '<div class="dsa-rnote">' + o.note + "</div>" : "") +
      '<div class="dsa-rmeta">' +
        '<span class="dsa-pattern">' + esc(p.pattern || "—") + "</span>" +
        (p.lc_id ? " · LC " + esc(p.lc_id) : "") +
        " · Day " + p.day +
        dsaStriverLinks(p) +
        (g.tags.length ? " · " + g.tags.map(function (t) { return '<span class="dsa-tag">' + esc(t) + "</span>"; }).join("") : "") +
      "</div>" +
      '<div class="dsa-chips">' + dsaPrimaryTheory(p.theory) + "</div>" +
      (open ? '<div class="dsa-detail" data-dsa-detail="' + esc(p.id) + '"><div class="dsa-loading">Loading…</div></div>' : "") +
      "</div>";
  }

  /* ------------------------------------------------------ problem panel */

  var DSA_COVERABLE = ["brainstorm", "algorithm", "pseudocode"];

  /* The spoiler model (PRD §8.3). LEARN means "read first, then code from an
     empty file", so everything is open. Every other role is attempted cold:
     only Understand shows, and each stage has to be uncovered on purpose.
     Cover mode puts brainstorm–pseudocode back under the cover, for a
     revision pass on paper. */
  function dsaCovered(p, stageId) {
    if (DSAV.revealed[stageId]) return false;
    if (DSAV.cover && DSA_COVERABLE.indexOf(stageId) !== -1) return true;
    return p.role !== "LEARN" && stageId !== "understand";
  }

  function dsaStageEl(p, doc, s) {
    if (DSAV.writeOnly && s.note === "screenshot") return "";
    var refs = (doc.theory_refs || []).filter(function (r) { return r.stage === s.id; });
    var chips = refs.length ? '<div class="dsa-chips">' + refs.map(function (r) {
      return dsaTheoryChip(r.page, r.section, (r.at ? r.at + " → " : "") + dsaTheoryTitle(r.page, r.section), r.why);
    }).join("") + "</div>" : "";
    var hd = '<div class="dsa-stagehd"><h4>' + esc(s.title) + "</h4>" + dsaNoteBadge(s.note) + "</div>";
    if (dsaCovered(p, s.id)) {
      return '<div class="dsa-stage covered">' + hd +
        '<button class="btn tiny" type="button" data-dsa-reveal="' + esc(s.id) + '">reveal</button></div>';
    }
    return '<div class="dsa-stage" data-stage="' + esc(s.id) + '">' + hd + dsaSectionBody(s) + chips + "</div>";
  }

  function dsaToolbar(p) {
    return '<div class="dsa-toolbar">' +
      '<label class="dsa-toggle"><input type="checkbox" data-dsa-writeonly="1"' + (DSAV.writeOnly ? " checked" : "") +
        "> ✍️ only <span class=\"muted\">— just what goes on paper</span></label>" +
      '<label class="dsa-toggle"><input type="checkbox" data-dsa-cover="1"' + (DSAV.cover ? " checked" : "") +
        "> hide brainstorm → pseudocode again</label>" +
      "</div>";
  }

  function dsaPanel(p, doc) {
    var role = dsaRole(p.role);
    var anyCovered = doc.stages.some(function (s) {
      return dsaCovered(p, s.id) && !(DSAV.writeOnly && s.note === "screenshot");
    });
    var done = isDoneStatus(dsaRow(p.id).status);
    return '<p class="dsa-rolenote">' + dsaRoleBadge(p.role) + " " + esc(role.meaning) + "</p>" +
      dsaToolbar(p) +
      '<div class="dsa-stages">' + doc.stages.map(function (s) { return dsaStageEl(p, doc, s); }).join("") + "</div>" +
      (anyCovered ? '<p class="dsa-revealall"><button class="btn tiny ghost" type="button" data-dsa-revealall="1">reveal all</button></p>' : "") +
      (done ? dsaSiblings(p, doc) : (doc.siblings || []).length
        ? '<p class="muted tiny dsa-sibhint">Siblings unlock here once this problem is done.</p>' : "") +
      dsaStuckPanel(p, doc) +
      dsaUserPanel(p.id);
  }

  function dsaPendingPanel(p) {
    var by = DSA_CORE.addDays(dsaDateOf(p.day), -5);
    return '<div class="dsa-lblock"><p class="muted">Full notes for Day ' + p.day + " arrive by <b>" +
      esc(dsaShortDate(by)) + "</b>. The problem, its role and its theory are already here — " +
      "you can start it from LeetCode and the pages above.</p></div>" +
      dsaStuckPanel(p, null) + dsaUserPanel(p.id);
  }

  function dsaFillDetail(id) {
    var host = document.querySelector('[data-dsa-detail="' + cssEsc(id) + '"]');
    var p = DSA_BY_ID[id];
    if (!host || !p) return;
    if (p.content !== "ready") { host.innerHTML = dsaPendingPanel(p); bindDsa(); return; }
    dsaGet("problem", id).then(function (doc) {
      if (DSAV.openId !== id) return;
      host.innerHTML = dsaPanel(p, doc);
      bindDsa();
    }).catch(function () {
      host.innerHTML = '<div class="dsa-lblock"><p class="muted">The notes for this problem are a static file ' +
        "that is not reachable from here. Everything else on the row still works.</p></div>" +
        dsaStuckPanel(p, null) + dsaUserPanel(id);
      bindDsa();
    });
  }

  /* ------------------------------------------------------ siblings */

  function dsaSiblingStages(s) {
    return '<p class="dsa-maps"><b>How it maps:</b> ' + mdInline(s.maps || "") + "</p>" +
      (s.stages || []).map(function (st) {
        if (DSAV.writeOnly && st.note === "screenshot") return "";
        return '<div class="dsa-stage"><div class="dsa-stagehd"><h4>' + esc(st.title) + "</h4>" +
          dsaNoteBadge(st.note) + "</div>" + dsaSectionBody(st) + "</div>";
      }).join("");
  }

  function dsaSiblingRow(s, parentId) {
    var g = DSA_S.siblings[s.id] || {};
    var open = DSAV.openSib === s.id;
    return '<div class="dsa-sib-row' + (g.studied ? " studied" : "") + (open ? " open" : "") + '">' +
      '<div class="dsa-rhead">' +
        '<span class="dsa-role r-' + (s.tier === "must" ? "MUST" : "OPT") + '">' + (s.tier === "must" ? "MUST" : "optional") + "</span>" +
        '<a class="dsa-title" href="' + esc(s.lc.url) + '" target="_blank" rel="noopener">' + esc(s.title) + "</a>" +
        dsaDiffBadge(s.lc.difficulty) +
        '<span class="dsa-actions">' +
          '<button type="button" class="dsa-check' + (g.studied ? " on" : "") + '" data-dsa-sib-studied="' + esc(s.id) +
            '" data-parent="' + esc(parentId) + '">' + (g.studied ? "studied ✓" : "studied") + "</button>" +
          '<button type="button" class="dsa-check' + (g.solved ? " on" : "") + '" data-dsa-sib-solved="' + esc(s.id) +
            '" data-parent="' + esc(parentId) + '">' + (g.solved ? "solved on LC ✓" : "solved on LC") + "</button>" +
          '<button class="dsa-expand" type="button" data-dsa-sib-open="' + esc(s.id) + '">' + (open ? "collapse" : "open") + "</button>" +
        "</span></div>" +
      (open ? '<div class="dsa-sib-body">' + dsaSiblingStages(s) + "</div>" : "") +
      "</div>";
  }

  function dsaSiblings(p, doc) {
    var sibs = (doc.siblings || []).slice().sort(function (a, b) {
      return (a.tier === "must" ? 0 : 1) - (b.tier === "must" ? 0 : 1);
    });
    if (!sibs.length) return "";
    var must = sibs.filter(function (s) { return s.tier === "must"; });
    var optional = sibs.filter(function (s) { return s.tier !== "must"; });
    return '<div class="dsa-lblock"><h4>Siblings</h4>' +
      '<p class="muted tiny">The must-study one comes up on Today tomorrow. Optional ones are never scheduled.</p>' +
      must.map(function (s) { return dsaSiblingRow(s, p.id); }).join("") +
      (optional.length ? '<details class="dsa-optsibs"><summary>' + optional.length + " optional sibling" +
        (optional.length === 1 ? "" : "s") + "</summary>" +
        optional.map(function (s) { return dsaSiblingRow(s, p.id); }).join("") + "</details>" : "") +
      "</div>";
  }

  /* ------------------------------------------------------ stuck ladder */

  function dsaStuckPanel(p, doc) {
    var ladder = DSA_PLAN.stuck_ladder || [];
    var started = DSAV.timers[p.id];
    var mins = started ? Math.floor((dsaNow() - started) / 60000) : -1;
    var refs = (doc && doc.stuck_refs) || {};

    var rungs = ladder.map(function (r) {
      var active = mins >= r.from_min && mins < r.to_min;
      var link = refs[String(r.from_min)];
      return '<li class="' + (active ? "now" : mins >= r.to_min ? "past" : "") + '">' +
        '<span class="dsa-rung">' + r.from_min + (r.to_min > 900 ? "+" : "–" + r.to_min) + " min</span>" +
        "<span>" + mdInline(r.do) +
        (link ? ' <a class="dsa-chip"' + dsaTheoryAttrs(link.page, link.section) + ">read: " +
          esc(dsaTheoryTitle(link.page, link.section)) + "</a>" : "") + "</span></li>";
    }).join("");

    return '<div class="dsa-stuck">' +
      '<div class="dsa-stuck-hd"><h4>Stuck ladder</h4>' +
        '<span class="dsa-timer" data-dsa-timer="' + esc(p.id) + '">' +
          (started ? mins + " min elapsed" : "not started") + "</span>" +
        '<button class="btn tiny" type="button" data-dsa-start="' + esc(p.id) + '">' +
          (started ? "reset" : "start timer") + "</button></div>" +
      '<ol class="dsa-ladder">' + rungs + "</ol>" +
      '<details class="dsa-ai"><summary>Using AI on this problem</summary><ul>' +
        (DSA_PLAN.ai_protocol || []).map(function (a) { return "<li>" + mdInline(a) + "</li>"; }).join("") +
      "</ul></details></div>";
  }

  function dsaUserPanel(id) {
    var g = dsaRow(id);
    var known = {};
    (DSA_PLAN.tag_seed || []).forEach(function (t) { known[t] = 1; });
    for (var pid in DSA_S.problems) {
      ((DSA_S.problems[pid] || {}).tags || []).forEach(function (t) { known[t] = 1; });
    }

    return '<div class="dsa-user">' +
      '<div class="dsa-userhd">Your record of this problem' +
        (g.first_done_at ? ' <span class="muted">· first done ' + esc(g.first_done_at) +
          (g.minutes_spent !== null ? " in " + g.minutes_spent + " min" : "") +
          (g.next_resolve_on ? " · next cold re-solve " + esc(g.next_resolve_on) : g.resolve_stage >= 3 ? " · all re-solves done" : "") +
          "</span>" : "") + "</div>" +
      '<label class="dsa-field wide"><span>My pseudocode <i>✍️</i></span>' +
        '<textarea data-dsa-pseudo="' + esc(id) + '" rows="5" spellcheck="false" ' +
        'placeholder="the pseudocode you wrote on paper, in the format from the Pseudocode stage">' +
        esc(g.my_pseudocode) + "</textarea></label>" +
      '<p class="dsa-hint wide">The step this plan exists to train: thoughts → pseudocode → code. ' +
        "Type it in after writing it on paper; a done problem without it is marked on the row.</p>" +
      '<label class="dsa-field"><span>My approach</span>' +
        '<input type="text" data-dsa-approach="' + esc(id) + '" value="' + esc(g.my_approach) +
        '" placeholder="one line on how you actually solved it"></label>' +
      '<label class="dsa-field"><span>GoodNotes</span>' +
        '<input type="text" data-dsa-goodnotes="' + esc(id) + '" value="' + esc(g.goodnotes_ref) +
        '" placeholder="e.g. DSA nb2 p.41"></label>' +
      '<label class="dsa-field wide"><span>Notes <i>markdown</i></span>' +
        '<textarea data-dsa-notes="' + esc(id) + '" rows="3" ' +
        'placeholder="what tripped you — for the version of you who meets this again">' + esc(g.notes) + "</textarea></label>" +
      '<div class="dsa-field wide"><span>Tags</span><div class="dsa-tagpick">' +
        Object.keys(known).sort().map(function (t) {
          return '<button type="button" class="dsa-tagb' + (g.tags.indexOf(t) !== -1 ? " on" : "") +
            '" data-dsa-tag="' + esc(id) + '" data-tag="' + esc(t) + '">' + esc(t) + "</button>";
        }).join("") +
        '<input type="text" class="dsa-tagnew" data-dsa-newtag="' + esc(id) + '" placeholder="+ new tag">' +
      "</div></div>" +
      "</div>";
  }

  /* ------------------------------------------------------ help */

  var DSA_UI_KEY = "launch-console-dsa-ui-v3";

  function dsaUiLoad() {
    try {
      var raw = localStorage.getItem(DSA_UI_KEY);
      if (!raw) return;
      var ui = JSON.parse(raw) || {};
      DSAV.help = ui.help || {};
      DSAV.writeOnly = !!ui.writeOnly;
      DSAV.timers = ui.timers || {};
    } catch (e) { /* first run, or storage blocked */ }
  }

  function dsaUiSave() {
    try {
      localStorage.setItem(DSA_UI_KEY, JSON.stringify({ help: DSAV.help, writeOnly: DSAV.writeOnly, timers: DSAV.timers }));
    } catch (e) { /* cache only */ }
  }

  /* A collapsible explainer, open the first time it is ever shown and closed
     once dismissed -- the first visit is when you need it. */
  function dsaHelp(key, summary, body) {
    var seen = DSAV.help[key];
    var open = seen === undefined ? true : !!seen;
    return '<details class="dsa-help"' + (open ? " open" : "") + ' data-dsa-help="' + esc(key) + '">' +
      "<summary>" + esc(summary) + "</summary>" +
      '<div class="dsa-helpbody">' + body + "</div></details>";
  }

  function dl(rows) {
    return '<dl class="dsa-dl">' + rows.map(function (r) {
      return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>";
    }).join("") + "</dl>";
  }

  function dsaTodayHelp() {
    var roles = DSA_PLAN.roles || {};
    var blocks = DSA_PLAN.daily_blocks || [];
    var rules = DSA_PLAN.mock_rules || {};
    return dsaHelp("today-v3", "How this plan works",
      "<p>Thirty days, 120 problems, four a day, foundations first. Day N is a date: it does not " +
      "move if you fall behind, and nothing here re-plans. Open the tab and do the first thing that " +
      "is expanded.</p>" +
      "<h4>The four roles</h4>" +
      dl(Object.keys(roles).map(function (k) { return [dsaRoleBadge(k), esc(roles[k].meaning)]; })) +
      "<h4>A day, in order</h4><ol class=\"dsa-loop\">" +
      blocks.map(function (b) {
        return "<li><b>" + esc(b.title) + "</b> <span class=\"muted\">" + b.minutes + " min</span> — " + esc(b.note) + "</li>";
      }).join("") + "</ol>" +
      "<h4>Bad days</h4>" +
      dl([
        ["<b>Floor</b>", "Due re-solves plus the day's first LEARN problem. Meeting it keeps the day and the streak."],
        ["<b>Never twice</b>", esc(DSA_PLAN.never_miss_twice || "")],
        ["<b>Behind</b>", esc(DSA_PLAN.carry_over || "")],
        ["<b>Cut order</b>", (DSA_PLAN.cut_order || []).map(function (c) { return c.step + ". " + esc(c.action); }).join("<br>")]
      ]) +
      "<h4>✍️ and 📸</h4>" +
      "<p>Every stage and theory section is tagged. ✍️ is for writing by hand in GoodNotes; 📸 is " +
      "reading material to screenshot. In a ✍️ 📸 section, only the marked lines are for writing. " +
      "The <b>✍️ only</b> switch in an open problem hides everything else.</p>" +
      "<h4>Mocks</h4>" +
      "<p>Dates are fixed and shown in the header from Day 1. On the morning, at 08:45, the exact " +
      "unlock time (somewhere " + esc((rules.unlock_time_window_ist || ["09:00", "17:00"]).join("–")) +
      " IST) is revealed; from then you have " + esc(String(rules.start_window_hours || 3)) + " hours to start it. " +
      "A missed window turns it into an unscored practice attempt.</p>");
  }

  /* ------------------------------------------------------ header strip */

  function dsaHeaderStrip(todayN, viewing) {
    var today = dsaToday();
    var inPlan = todayN >= 1 && todayN <= DSA_PLAN.days.length;
    var d = DSA_PLAN.days[dsaClampDay(viewing) - 1];
    var mock = dsaNextMock(today);
    var behind = inPlan ? dsaBehind(todayN).length : 0;
    var floor = inPlan ? dsaFloor(todayN, today) : null;
    var streak = inPlan ? dsaStreak(todayN) : 0;

    var mockTxt = "";
    if (mock) {
      var left = DSA_CORE.daysBetween(today, mock.date);
      var live = DSA_SCHED[mock.id] || {};
      var when = left > 0 ? left + " day" + (left === 1 ? "" : "s")
        : live.state === "unlocked" ? "<b>open now</b> · start by " + DSA_CORE.istClock(live.window_closes)
        : live.state === "revealed" ? "<b>unlocks " + DSA_CORE.istClock(live.unlock_at) + "</b> · start by " + DSA_CORE.istClock(live.window_closes)
        : live.state === "started" ? "<b>in progress</b>"
        : live.state === "submitted" ? "taken"
        : live.state === "missed" ? "missed — practice open"
        : "<b>today</b> · time at 08:45";
      mockTxt = '<a href="#" class="dsa-strip-item mock" data-dsa-tab="dsa-oa">' + esc(dsaMockLabel(mock)) + " · " +
        esc(dsaShortDate(mock.date)) + " · " + when + "</a>";
    }
    return '<div class="dsa-strip">' +
      '<span class="dsa-strip-item day"><b>Day ' + d.day + "</b> of " + DSA_PLAN.days.length + " · " +
        esc(dsaShortDate(d.date)) + " · " + esc(dsaCluster(d.cluster).title) + "</span>" +
      mockTxt +
      (behind ? '<span class="dsa-strip-item warn">behind by ' + behind + "</span>" : "") +
      (floor ? '<span class="dsa-strip-item ' + (floor.ok ? "ok" : "") + '">floor: ' +
        (floor.ok ? "done ✓" : esc(floor.missing.join(" + "))) + "</span>" : "") +
      (inPlan ? '<span class="dsa-strip-item">streak ' + streak + "</span>" : "") +
      "</div>";
  }

  /* ------------------------------------------------------ Today */

  function dsaBlock(key, title, minutes, body, extra) {
    return '<section class="card dsa-block" data-block="' + esc(key) + '">' +
      '<div class="dsa-blockhd"><h3>' + esc(title) + "</h3>" +
      (minutes ? '<span class="muted tiny">' + minutes + " min</span>" : "") + (extra || "") + "</div>" + body + "</section>";
  }

  function dsaBlockMeta(key) {
    var bs = DSA_PLAN.daily_blocks || [];
    for (var i = 0; i < bs.length; i++) if (bs[i].key === key) return bs[i];
    return { title: titleCase(key), minutes: 0 };
  }

  function dsaResolveRow(p) {
    var g = dsaRow(p.id);
    var n = g.resolve_stage + 1;
    return '<div class="dsa-resolve">' +
      '<div class="dsa-rhead">' + dsaRoleBadge(p.role) +
        '<a class="dsa-title" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>" +
        dsaDiffBadge(p.difficulty) +
        '<span class="muted tiny">re-solve ' + n + " of 3 · due " + esc(g.next_resolve_on) + " · from Day " + p.day + "</span>" +
      "</div>" +
      '<div class="dsa-resolve-do"><span class="muted tiny">Cold, from an empty file, no notes. Then rate it:</span>' +
        [1, 2, 3, 4, 5].map(function (c) {
          return '<button type="button" class="btn tiny" data-dsa-resolve="' + esc(p.id) + '" data-n="' + c + '">' + c + "</button>";
        }).join("") +
        ' <a href="#" class="linkish tiny" data-dsa-goto="' + esc(p.id) + '">open the problem</a></div>' +
      "</div>";
  }

  function dsaMustSiblingBlock(today) {
    var due = dsaDueSiblings(today);
    if (!due.length) return "";
    var meta = dsaBlockMeta("must_sibling");
    var body = due.slice(0, 4).map(function (p) {
      var doc = DSA_CACHE.problem[p.id];
      if (!doc) {
        dsaGet("problem", p.id).then(function () { if (SECTION === "dsa") render(); }).catch(function () {});
        return '<div class="dsa-sib-row"><div class="dsa-rhead"><span class="dsa-title">' + esc(p.must.title) +
          '</span><span class="muted tiny">Loading…</span></div></div>';
      }
      var s = (doc.siblings || []).filter(function (x) { return x.id === p.must.id; })[0];
      if (!s) return "";
      return '<p class="muted tiny dsa-sibfor">for <a href="#" class="linkish" data-dsa-goto="' + esc(p.id) + '">' +
        esc(p.title) + "</a></p>" + dsaSiblingRow(s, p.id);
    }).join("");
    return dsaBlock("must_sibling", meta.title, meta.minutes, body);
  }

  function dsaMicroBlock(n, doc) {
    var meta = dsaBlockMeta("micro");
    if (!doc) return dsaBlock("micro", meta.title, meta.minutes, '<div class="dsa-loading">Loading…</div>');
    var led = dsaDayLedger(n);
    var micro = doc.micro || {};
    return dsaBlock("micro", meta.title, meta.minutes,
      '<h4 class="dsa-microtitle">' + esc(micro.title || "") + "</h4>" +
      '<div class="dsa-chips">' + dsaPrimaryTheory(micro.theory) + "</div>" +
      (micro.sections || []).map(function (s) {
        if (DSAV.writeOnly && s.note === "screenshot") return "";
        return '<div class="dsa-stage"><div class="dsa-stagehd"><h4>' + esc(s.title) + "</h4>" + dsaNoteBadge(s.note) +
          "</div>" + dsaSectionBody(s) + "</div>";
      }).join(""),
      '<label class="dsa-toggle right"><input type="checkbox" data-dsa-dayflag="micro_read" data-day="' + n + '"' +
        (led.micro_read ? " checked" : "") + "> read</label>");
  }

  function dsaDrillCard(it, n) {
    var g = DSA_S.drill[it.id] || {};
    var shown = DSAV.drillShown[it.id] || g.correct !== null && g.correct !== undefined;
    return '<div class="dsa-drill' + (g.correct === true ? " right" : g.correct === false ? " wrong" : "") + '">' +
      '<p class="dsa-drill-q">' + mdInline(it.statement) + "</p>" +
      '<input type="text" class="dsa-drill-guess" data-dsa-guess="' + esc(it.id) + '" data-day="' + n + '" value="' +
        esc(g.guess || "") + '" placeholder="pattern + one-line approach">' +
      (shown
        ? '<div class="dsa-drill-a">' +
            '<p><b>' + esc(it.pattern_name) + "</b> — " + mdInline(it.approach) + "</p>" +
            '<p class="muted tiny"><b>Trigger:</b> ' + mdInline(it.trigger) + " · <b>" + esc(it.complexity) + "</b></p>" +
            '<div class="dsa-chips">' + dsaTheoryChip(it.pattern_page, null) +
              '<a class="dsa-chip out" href="' + esc(it.lc.url) + '" target="_blank" rel="noopener">' + esc(it.title) + " on LeetCode</a></div>" +
            '<div class="dsa-drill-mark"><span class="muted tiny">Did you get it?</span>' +
              '<button type="button" class="dsa-check' + (g.correct === true ? " on" : "") + '" data-dsa-drillmark="' + esc(it.id) +
                '" data-day="' + n + '" data-v="1">✓ got it</button>' +
              '<button type="button" class="dsa-check' + (g.correct === false ? " on bad" : "") + '" data-dsa-drillmark="' + esc(it.id) +
                '" data-day="' + n + '" data-v="0">✗ missed</button></div>' +
          "</div>"
        : '<button type="button" class="btn tiny" data-dsa-drillshow="' + esc(it.id) + '">reveal</button>') +
      "</div>";
  }

  function dsaDrillBlock(n, doc) {
    var meta = dsaBlockMeta("drill");
    if (!doc) return dsaBlock("drill", meta.title, meta.minutes, '<div class="dsa-loading">Loading…</div>');
    var answered = (doc.drill || []).filter(function (it) {
      var g = DSA_S.drill[it.id]; return g && g.correct !== null && g.correct !== undefined;
    }).length;
    return dsaBlock("drill", meta.title, meta.minutes,
      '<p class="muted tiny">Unseen problems. Name the pattern and the approach in one line before revealing — ' +
      "recognition is the skill the mocks test.</p>" +
      '<div class="dsa-drills">' + (doc.drill || []).map(function (it) { return dsaDrillCard(it, n); }).join("") + "</div>",
      '<span class="muted tiny">' + answered + " / " + (doc.drill || []).length + "</span>");
  }

  function dsaCsBlock(n, doc) {
    var meta = dsaBlockMeta("cs_core");
    if (!doc) return dsaBlock("cs_core", meta.title, meta.minutes, '<div class="dsa-loading">Loading…</div>');
    var c = doc.cs_core;
    if (!c) return "";
    var led = dsaDayLedger(n);
    return dsaBlock("cs_core", meta.title + " · " + c.subject, meta.minutes,
      '<h4 class="dsa-microtitle">' + esc(c.title) + "</h4>" +
      (c.sections || []).map(function (s) {
        if (DSAV.writeOnly && s.note === "screenshot") return "";
        return '<div class="dsa-stage"><div class="dsa-stagehd"><h4>' + esc(s.title) + "</h4>" + dsaNoteBadge(s.note) +
          "</div>" + dsaSectionBody(s) + "</div>";
      }).join(""),
      '<label class="dsa-toggle right"><input type="checkbox" data-dsa-dayflag="cs_core_done" data-day="' + n + '"' +
        (led.cs_core_done ? " checked" : "") + "> done</label>");
  }

  function dsaSkims(d) {
    if (!(d.skims || []).length) return "";
    return '<div class="dsa-skims"><span class="muted tiny">Skim for recognition only:</span> ' +
      d.skims.map(function (s) {
        return '<a class="dsa-chip out" href="' + esc(s.lc.url) + '" target="_blank" rel="noopener">' + esc(s.title) + "</a>" +
          dsaPrimaryTheory(s.theory);
      }).join(" ") + "</div>";
  }

  /* The first unfinished item, expanded on arrival (PRD §4: "No item
     requires choosing what to do next"). Only the first time the view is
     painted for a day, so collapsing it is respected afterwards. */
  var DSA_AUTO_OPENED = {};
  function dsaAutoOpen(n, rows) {
    if (DSA_AUTO_OPENED[n]) return;
    DSA_AUTO_OPENED[n] = true;
    if (DSAV.openId) return;
    for (var i = 0; i < rows.length; i++) {
      if (!isDoneStatus(dsaRow(rows[i].id).status)) { DSAV.openId = rows[i].id; DSAV.revealed = {}; DSAV.cover = false; return; }
    }
  }

  function renderDsaToday() {
    if (!DSA_PLAN) {
      return '<section class="card"><h2>DSA plan</h2><p class="muted">' +
        "No DSA content has been imported. Run <code>npm run import</code>, then <code>npm run build</code>.</p></section>";
    }
    var today = dsaToday();
    var todayN = dsaTodayN();
    var total = DSA_PLAN.days.length;
    var n = dsaClampDay(DSAV.day || todayN);
    var isToday = n === todayN;
    var d = DSA_PLAN.days[n - 1];
    var doc = d.content === "ready" ? dsaDayDoc(n) : null;
    var rows = dsaProblemsOn(n);
    var mock = dsaMockOn(n);

    var out = dsaTodayHelp() + dsaHeaderStrip(todayN, n);

    if (todayN < 1 && !DSAV.day) {
      out += '<section class="card dsa-banner"><h3>Starts ' + esc(dsaShortDate(DSA_PLAN.start_date)) + "</h3>" +
        '<p class="muted">' + (1 - todayN) + " day" + (todayN === 0 ? "" : "s") +
        " to go. Below is Day 1, so you can read the micro-theory tonight if you want a head start.</p></section>";
    } else if (todayN > total && !DSAV.day) {
      out += '<section class="card dsa-banner"><h3>The 30 days are done</h3><p class="muted">From here to ' +
        esc(DSA_PLAN.placement_day) + ": " + esc(((DSA_PLAN.post_plan || {}).focus || []).join(" · ")) +
        '. The <a href="#" class="linkish" data-dsa-tab="dsa-revision">revision queue</a> is where the daily work lives now.</p></section>';
    }

    // Never miss twice.
    if (isToday && todayN > 1 && todayN <= total && !dsaDayLedger(todayN - 1).kept) {
      var f = dsaFloor(todayN, today);
      if (!f.ok) {
        out += '<div class="dsa-alert">Yesterday was missed — <b>floor first today</b>: ' + esc(f.missing.join(" + ")) + ".</div>";
      }
    }

    // Coverage warning, two days out and on the day (PRD §10): never a lock.
    var nextMock = dsaNextMock(today);
    if (isToday && nextMock && DSA_CORE.daysBetween(today, nextMock.date) <= 2) {
      var unfinished = DSA_PROBLEMS.filter(function (p) {
        return nextMock.covers_days.indexOf(p.day) !== -1 && dsaRow(p.id).status === "todo";
      }).length;
      var ms = DSA_SCHED[nextMock.id] || {};
      if (unfinished && ms.state !== "started" && ms.state !== "submitted" && ms.state !== "missed") {
        out += '<div class="dsa-alert soft">' + esc(dsaMockLabel(nextMock)) + " on " + esc(dsaShortDate(nextMock.date)) +
          " covers days " + nextMock.covers_days[0] + "–" + nextMock.covers_days[nextMock.covers_days.length - 1] +
          ". You have <b>" + unfinished + "</b> unfinished problem" + (unfinished === 1 ? "" : "s") +
          " from those days — take it anyway; it measures where you are.</div>";
      }
    }
    if (isToday && mock) dsaMockDayCut(mock, today);

    out += '<div class="dsa-daynav">' +
      '<button class="btn tiny" type="button" data-dsa-day="' + Math.max(1, n - 1) + '"' + (n <= 1 ? " disabled" : "") + ">‹ prev</button>" +
      '<div class="dsa-dayhd"><h2>Day ' + n + " · " + esc(d.title) + "</h2>" +
        '<div class="muted">' + esc(dsaShortDate(d.date)) + " · " + esc(dsaCluster(d.cluster).title) +
        (mock ? ' · <b class="dsa-mockday">' + esc(dsaMockLabel(mock)) + " today</b>" : "") +
        (isToday ? "" : ' · <a href="#" class="linkish" data-dsa-day="0">back to today</a>') + "</div></div>" +
      '<button class="btn tiny" type="button" data-dsa-day="' + Math.min(total, n + 1) + '"' + (n >= total ? " disabled" : "") + ">next ›</button>" +
      "</div>";

    // 1. Due re-solves -- today only.
    if (isToday) {
      var due = dsaDueResolves(today);
      if (due.length) {
        var rm = dsaBlockMeta("resolves");
        out += dsaBlock("resolves", rm.title, rm.minutes, due.slice(0, 2).map(dsaResolveRow).join("") +
          (due.length > 2 ? '<p class="muted tiny">+' + (due.length - 2) + ' more in <a href="#" class="linkish" data-dsa-tab="dsa-revision">Revision</a>.</p>' : ""));
      }
      // 2. Must-study siblings.
      out += dsaMustSiblingBlock(today);
    }

    // 3. Micro-theory and pattern card.
    if (d.content === "ready") out += dsaMicroBlock(n, doc);

    // 4. Carried over, then today's problems.
    var carried = isToday ? dsaCarried(todayN) : [];
    var autoRows = carried.slice(0, 4).concat(rows);
    if (isToday || todayN < 1) dsaAutoOpen(n, autoRows);
    var pm = dsaBlockMeta("problems");
    out += dsaBlock("problems", pm.title, pm.minutes,
      (carried.length ? '<h4 class="dsa-sub">Carried over</h4><div class="dsa-rows">' +
        carried.slice(0, 4).map(function (p) { return dsaRowEl(p, { note: "carried over from Day " + p.day }); }).join("") + "</div>" +
        (carried.length > 4 ? '<p class="muted tiny">+' + (carried.length - 4) + ' more — see the <a href="#" class="linkish" data-dsa-tab="dsa-plan">plan</a>.</p>' : "") +
        '<h4 class="dsa-sub">Today</h4>' : "") +
      '<div class="dsa-rows">' + rows.map(function (p) {
        var g = dsaRow(p.id);
        return dsaRowEl(p, g.cut_state === "queued" && g.status === "todo"
          ? { note: mock ? "moved to the revision queue (mock day) — due " + esc(g.next_resolve_on || "") : "queued for revision by the cut order" }
          : undefined);
      }).join("") + "</div>" + dsaSkims(d));

    // 5. Drill, 6. CS core.
    if (d.content === "ready") {
      out += dsaDrillBlock(n, doc);
      out += dsaCsBlock(n, doc);
    } else {
      out += '<section class="card"><p class="muted">Micro-theory, drill and CS card for Day ' + n +
        " arrive with the notes, by " + esc(dsaShortDate(DSA_CORE.addDays(d.date, -5))) + ".</p></section>";
    }
    return out;
  }

  /* Mock-day load (PRD §8.2): three problems, so the DISGUISE one (or the
     last) goes to the revision queue for two days later. The cron does this
     at 08:45; this is the same move for a page opened first, and a no-op
     once done or once the problem has been touched. */
  var DSA_CUT_DONE = {};
  function dsaMockDayCut(mock, today) {
    if (DSA_CUT_DONE[mock.id]) return;
    DSA_CUT_DONE[mock.id] = true;
    var p = DSA_CORE.mockDayCut(dsaCtx(mock.day, today), mock.day);
    if (!p) return;
    var g = dsaRow(p.id);
    if (g.status !== "todo" || g.cut_state) return;
    dsaPatch(p.id, { cut_state: "queued", next_resolve_on: DSA_CORE.addDays(today, 2) });
  }

  /* Keep the day when its floor is met. Written once, never un-kept: a day
     you kept stays kept even if you later reset a status by mistake. */
  function dsaMaybeKeep() {
    var todayN = dsaTodayN();
    if (todayN < 1 || todayN > DSA_PLAN.days.length) return;
    if (dsaDayLedger(todayN).kept) return;
    if (dsaFloor(todayN, dsaToday()).ok) dsaPatchDay(todayN, { kept: true });
  }

  /* ------------------------------------------------------ Plan */

  function renderDsaPlan() {
    var todayN = dsaTodayN();
    var all = dsaStats(DSA_PROBLEMS);
    var rowsHtml = (DSA_PLAN.clusters || []).map(function (c) {
      return '<div class="dsa-pcluster"><h4>' + esc(c.title) + ' <span class="muted tiny">days ' + c.days[0] + "–" +
        c.days[c.days.length - 1] + "</span></h4><div class=\"dsa-pdays-grid\">" +
        c.days.map(function (n) {
          var d = DSA_PLAN.days[n - 1];
          var mock = dsaMockOn(n);
          var dots = dsaProblemsOn(n).map(function (p) {
            var g = dsaRow(p.id);
            var cls = g.cut_state === "queued" ? "queued" : g.status;
            return '<i class="dot ' + cls + '" title="' + esc(p.title + " · " + p.role + " · " + (g.cut_state || g.status)) + '"></i>';
          }).join("") + (d.skims || []).map(function (s) {
            return '<i class="dot skim" title="skim: ' + esc(s.title) + '"></i>';
          }).join("");
          return '<button type="button" class="dsa-pday' + (n === todayN ? " today" : "") + (n < todayN ? " past" : "") +
            (d.content === "ready" ? "" : " pending") + '" data-dsa-day="' + n + '" data-dsa-tab="dsa-today">' +
            '<span class="n">' + n + '</span><span class="dt">' + esc(dsaShortDate(d.date)) + "</span>" +
            (mock ? '<span class="mk">' + esc(dsaMockLabel(mock)) + "</span>" : "") +
            '<span class="dots">' + dots + "</span></button>";
        }).join("") + "</div></div>";
    }).join("");
    var pp = DSA_PLAN.post_plan || {};
    return '<section class="card"><h2>The plan</h2><p class="muted">' + DSA_PLAN.problem_count + " problems over " +
      DSA_PLAN.days.length + " days, " + esc(dsaShortDate(DSA_PLAN.start_date)) + " to " + esc(dsaShortDate(DSA_PLAN.end_date)) +
      ". " + all.done + " done" + (all.revisit ? " (" + all.revisit + " to revisit)" : "") +
      (todayN >= 1 ? " · behind by " + dsaBehind(todayN).length : "") + ".</p>" +
      '<div class="dsa-legend-dots"><i class="dot todo"></i> todo <i class="dot solved"></i> solved <i class="dot revisit"></i> revisit ' +
      '<i class="dot skimmed"></i> skimmed <i class="dot queued"></i> queued <i class="dot skim"></i> skim</div>' +
      rowsHtml +
      '<p class="muted tiny">After the plan: ' + esc(pp.start ? dsaShortDate(pp.start) + " – " + dsaShortDate(pp.end) : "") +
      " · " + esc((pp.focus || []).join(" · ")) + "</p></section>";
  }

  /* ------------------------------------------------------ Theory */

  function dsaTopicOrder() {
    var first = {};
    DSA_PROBLEMS.forEach(function (p) {
      (p.theory || []).forEach(function (t) {
        var topic = ((DSA_INDEX.theory || {})[t] || {}).topic;
        if (topic && (first[topic] === undefined || p.day < first[topic])) first[topic] = p.day;
      });
    });
    return Object.keys((DSA_TINDEX && DSA_TINDEX.topics) || {}).sort(function (a, b) {
      if (a === "meta") return -1;
      if (b === "meta") return 1;
      return (first[a] || 99) - (first[b] || 99) || a.localeCompare(b);
    });
  }

  function dsaTodayPages() {
    var n = dsaClampDay(dsaTodayN());
    var ids = [];
    var d = DSA_PLAN.days[n - 1];
    ((d.micro && d.micro.theory) || []).forEach(function (t) { if (ids.indexOf(t) === -1) ids.push(t); });
    dsaProblemsOn(n).forEach(function (p) {
      (p.theory || []).forEach(function (t) { if (ids.indexOf(t) === -1) ids.push(t); });
    });
    return ids;
  }

  function dsaPageCard(row) {
    return '<a class="dsa-theorycard"' + dsaTheoryAttrs(row.id, null) + ">" +
      '<span class="dsa-kind k-' + esc(row.kind) + '">' + esc(row.kind) + "</span>" +
      "<b>" + esc(row.title) + "</b>" +
      '<span class="muted tiny">' + esc(row.summary || "") + "</span>" +
      (row.used ? '<span class="muted tiny">used ' + row.used + "×</span>" : "") + "</a>";
  }

  function dsaTheoryList() {
    if (!DSA_TINDEX) return '<div class="dsa-loading">Loading…</div>';
    var q = DSAV.theoryQ.trim().toLowerCase();
    var byId = {};
    DSA_TINDEX.pages.forEach(function (r) { byId[r.id] = r; });
    var match = function (r) {
      return !q || r.title.toLowerCase().indexOf(q) !== -1 || (r.summary || "").toLowerCase().indexOf(q) !== -1 ||
        r.id.indexOf(q) !== -1;
    };
    var pinned = q ? [] : dsaTodayPages().map(function (id) { return byId[id]; }).filter(Boolean);
    return (pinned.length ? '<h4 class="dsa-sub">Used today</h4><div class="dsa-theorylist">' + pinned.map(dsaPageCard).join("") + "</div>" : "") +
      dsaTopicOrder().map(function (topic) {
        var pages = (DSA_TINDEX.topics[topic] || []).map(function (id) { return byId[id]; }).filter(Boolean).filter(match);
        if (!pages.length) return "";
        return '<h4 class="dsa-sub">' + esc(titleCase(topic)) + ' <span class="muted tiny">' + pages.length + "</span></h4>" +
          '<div class="dsa-theorylist">' + pages.map(dsaPageCard).join("") + "</div>";
      }).join("") || '<div class="empty">No page matches.</div>';
  }

  function dsaPatternList() {
    return '<div class="dsa-patterns">' + (DSA_INDEX.patterns || []).map(function (pt) {
      return '<div class="dsa-patrow"><div class="dsa-rhead"><span class="dsa-pattern">' + esc(pt.pattern) + "</span>" +
        (pt.primary_page ? dsaTheoryChip(pt.primary_page, null) : "") + "</div>" +
        '<div class="dsa-sibs">' + pt.problems.map(function (id) {
          var p = DSA_BY_ID[id];
          var g = dsaRow(id);
          return '<a href="#" class="dsa-sib in st-' + g.status + '" data-dsa-goto="' + esc(id) + '">' + esc(p.title) +
            ' <span class="muted tiny">D' + p.day + "</span></a>";
        }).join("") + "</div></div>";
    }).join("") + "</div>";
  }

  function renderDsaTheory() {
    if (DSAV.theory) {
      return '<section class="card"><button class="btn tiny" type="button" data-dsa-theory-back="1">‹ all theory</button>' +
        '<div id="dsaTheoryBody"><div class="dsa-loading">Loading…</div></div></section>';
    }
    if (!DSA_TINDEX) dsaTheoryIndex().then(function () { if (ACTIVE === "dsa-theory") render(); }).catch(function () {});
    return '<section class="card"><h2>Theory</h2>' +
      '<p class="muted">161 short pages. Problems link to exact sections; every section says which problems use it.</p>' +
      '<div class="dsa-seg">' +
        '<button type="button" class="tab' + (DSAV.theoryView === "pages" ? " on" : "") + '" data-dsa-tview="pages">Pages</button>' +
        '<button type="button" class="tab' + (DSAV.theoryView === "patterns" ? " on" : "") + '" data-dsa-tview="patterns">Patterns</button>' +
      "</div>" +
      (DSAV.theoryView === "patterns" ? dsaPatternList()
        : '<input type="search" class="dsa-tsearch" id="dsaTheoryQ" value="' + esc(DSAV.theoryQ) +
          '" placeholder="search titles and summaries">' + '<div id="dsaTheoryList">' + dsaTheoryList() + "</div>") +
      "</section>";
  }

  function dsaUsedByLink(u) {
    if (u.kind === "problem" && DSA_BY_ID[u.id]) {
      return '<a href="#" class="linkish" data-dsa-goto="' + esc(u.id) + '">' + esc(DSA_BY_ID[u.id].title) + "</a>" +
        ' <span class="muted tiny">D' + u.day + (u.stage && u.stage !== "primary" ? " · " + esc(u.stage.replace("_", " ")) : "") +
        (u.at ? " · " + esc(u.at) : "") + "</span>";
    }
    if (u.kind === "sibling") {
      var parent = DSA_BY_ID[u.at];
      return esc(titleCase(u.id)) + ' <span class="muted tiny">sibling of ' +
        (parent ? '<a href="#" class="linkish" data-dsa-goto="' + esc(parent.id) + '">' + esc(parent.title) + "</a>" : esc(u.at)) + "</span>";
    }
    if (u.kind === "micro" || u.kind === "drill") {
      return '<a href="#" class="linkish" data-dsa-day="' + u.day + '" data-dsa-tab="dsa-today">Day ' + u.day + " " +
        (u.kind === "micro" ? "micro-theory" : "drill") + "</a>" + (u.at ? ' <span class="muted tiny">' + esc(u.at) + "</span>" : "");
    }
    return esc(titleCase(u.id)) + ' <span class="muted tiny">' + esc(u.kind) + " · D" + u.day + "</span>";
  }

  function dsaUsedBy(rows) {
    if (!rows.length) return "";
    return '<details class="dsa-usedby"><summary>Used by ' + rows.length + "</summary><ul>" +
      rows.map(function (u) { return "<li>" + dsaUsedByLink(u) + "</li>"; }).join("") + "</ul></details>";
  }

  function dsaTheoryPageHtml(doc) {
    var used = doc.used_by || [];
    var pageLevel = used.filter(function (u) { return !u.section; });
    var chips = function (label, ids) {
      return (ids || []).length ? '<div class="dsa-chips"><span class="muted tiny">' + label + "</span>" +
        ids.map(function (id) { return dsaTheoryChip(id, null); }).join("") + "</div>" : "";
    };
    return '<div class="dsa-tpage">' +
      '<h2>' + esc(doc.title) + ' <span class="dsa-kind k-' + esc(doc.kind) + '">' + esc(doc.kind) + "</span></h2>" +
      '<p class="muted">' + mdInline(doc.summary || "") + "</p>" +
      chips("prereqs", doc.prereqs) + chips("related", doc.related) +
      '<div class="dsa-toolbar"><label class="dsa-toggle"><input type="checkbox" data-dsa-writeonly="1"' +
        (DSAV.writeOnly ? " checked" : "") + "> ✍️ only</label>" + dsaUsedBy(pageLevel) + "</div>" +
      (doc.sections || []).map(function (s) {
        var body = dsaSectionBody(s);
        if (!body && DSAV.writeOnly) return "";
        return '<div class="dsa-tsec" id="dsa-sec-' + esc(doc.id) + "-" + esc(s.id) + '">' +
          '<div class="dsa-stagehd"><h4>' + esc(s.title) + "</h4>" + dsaNoteBadge(s.note) + "</div>" + body +
          dsaUsedBy(used.filter(function (u) { return u.section === s.id; })) + "</div>";
      }).join("") + "</div>";
  }

  function dsaFlash(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("flash");
    setTimeout(function () { el.classList.remove("flash"); }, 2000);
  }

  function dsaFillTheory() {
    var host = document.getElementById("dsaTheoryBody");
    if (!host || !DSAV.theory) return;
    var page = DSAV.theory, sec = DSAV.theorySec;
    dsaGet("theory", page).then(function (doc) {
      if (DSAV.theory !== page) return;
      host.innerHTML = dsaTheoryPageHtml(doc);
      bindDsa();
      if (sec) { DSAV.theorySec = null; dsaFlash(document.getElementById("dsa-sec-" + page + "-" + sec)); }
    }).catch(function () {
      host.innerHTML = '<p class="muted">That theory page is not reachable from here.</p>';
    });
  }

  /* The side drawer: a theory section opened from inside a problem, on a
     screen wide enough to read both at once. The open row stays exactly as
     it was underneath. */
  function dsaDrawerWide() { return window.innerWidth >= 1100; }

  function dsaOpenDrawer(page, sec) {
    var el = document.getElementById("dsaDrawer");
    if (!el) {
      el = document.createElement("aside");
      el.id = "dsaDrawer";
      el.className = "dsa-drawer";
      document.body.appendChild(el);
    }
    DSAV.drawer = { page: page, sec: sec };
    el.innerHTML = '<div class="dsa-drawerhd"><a class="linkish tiny"' + dsaTheoryAttrs(page, sec) +
      ' data-dsa-full="1">open full page</a><button class="btn tiny" type="button" data-dsa-drawer-close="1">close ✕</button></div>' +
      '<div class="dsa-drawerbody"><div class="dsa-loading">Loading…</div></div>';
    el.classList.add("on");
    dsaGet("theory", page).then(function (doc) {
      if (!DSAV.drawer || DSAV.drawer.page !== page) return;
      el.querySelector(".dsa-drawerbody").innerHTML = dsaTheoryPageHtml(doc);
      bindDsa();
      var target = sec ? document.getElementById("dsa-sec-" + page + "-" + sec) : null;
      if (target) {
        el.querySelector(".dsa-drawerbody").scrollTop = target.offsetTop - 60;
        target.classList.add("flash");
        setTimeout(function () { target.classList.remove("flash"); }, 2000);
      }
    }).catch(function () {
      el.querySelector(".dsa-drawerbody").innerHTML = '<p class="muted">That theory page is not reachable from here.</p>';
    });
  }

  function dsaCloseDrawer() {
    DSAV.drawer = null;
    var el = document.getElementById("dsaDrawer");
    if (el) el.classList.remove("on");
  }

  function dsaOpenTheory(page, sec, push) {
    dsaCloseDrawer();
    SECTION = "dsa";
    ACTIVE = "dsa-theory";
    DSAV.theory = page;
    DSAV.theorySec = sec || null;
    if (push !== false) {
      var h = "#dsa/theory/" + page + (sec ? "/" + sec : "");
      if (location.hash !== h) history.pushState(null, "", h);
    }
    render();
    window.scrollTo({ top: 0 });
  }

  /* #dsa/theory/<page>/<section>, #dsa/plan, #dsa/day/<n>. Anything else
     under #dsa lands on Today. */
  function dsaRoute(hash) {
    var parts = String(hash || "").replace(/^#/, "").split("/");
    if (parts[0] !== "dsa" || !DSA_PLAN) return false;
    SECTION = "dsa";
    if (parts[1] === "theory") {
      if (parts[2]) { dsaOpenTheory(parts[2], parts[3], false); return true; }
      DSAV.theory = null;
      ACTIVE = "dsa-theory";
    } else if (parts[1] === "plan") ACTIVE = "dsa-plan";
    else if (parts[1] === "revision") ACTIVE = "dsa-revision";
    else if (parts[1] === "browse") ACTIVE = "dsa-browse";
    else if (parts[1] === "oa") ACTIVE = "dsa-oa";
    else if (parts[1] === "day" && +parts[2]) { ACTIVE = "dsa-today"; DSAV.day = dsaClampDay(+parts[2]); }
    else if (parts[1] === "problem" && DSA_BY_ID[parts[2]]) {
      // The nudge email's deep link: open that row on its day.
      var pr = DSA_BY_ID[parts[2]];
      ACTIVE = "dsa-today";
      DSAV.day = pr.day === dsaTodayN() ? 0 : pr.day;
      DSAV.openId = pr.id;
      DSA_AUTO_OPENED[pr.day] = true;
    }
    else ACTIVE = "dsa-today";
    return true;
  }

  /* ------------------------------------------------------ Revision */

  function renderDsaRevision() {
    var today = dsaToday();
    var due = dsaDueResolves(today);
    var queued = DSA_PROBLEMS.filter(function (p) {
      var g = dsaRow(p.id);
      return g.cut_state === "queued" && g.status === "todo";
    });
    var weak = DSA_PROBLEMS.filter(function (p) {
      var g = dsaRow(p.id);
      if (g.status === "todo") return false;
      return g.revision || (g.confidence !== null && g.confidence <= 3);
    }).sort(function (a, b) {
      var ga = dsaRow(a.id), gb = dsaRow(b.id);
      var ca = ga.confidence === null ? 99 : ga.confidence;
      var cb = gb.confidence === null ? 99 : gb.confidence;
      if (ca !== cb) return ca - cb;
      return (ga.last_revised || "").localeCompare(gb.last_revised || "");
    });
    var misses = Object.keys(DSA_S.drill).filter(function (id) { return DSA_S.drill[id].correct === false; });
    var studied = Object.keys(DSA_S.siblings).filter(function (id) { return DSA_S.siblings[id].studied; });

    var sec = function (title, note, inner) {
      return '<section class="card"><h3>' + esc(title) + "</h3>" + (note ? '<p class="muted tiny">' + note + "</p>" : "") + inner + "</section>";
    };
    var empty = function (t) { return '<div class="empty">' + t + "</div>"; };

    return sec("Due re-solves", "Cold, from an empty file. Today shows the oldest two; this is all of them.",
        due.length ? due.map(dsaResolveRow).join("") : empty("Nothing due.")) +
      sec("Queued by the cut order", "Problems moved here instead of being dropped.",
        queued.length ? '<div class="dsa-rows">' + queued.map(function (p) { return dsaRowEl(p); }).join("") + "</div>" : empty("Nothing queued.")) +
      sec("Low confidence or starred", "Started, and either starred or rated 3 or below — weakest first, then least recently revised.",
        weak.length ? '<div class="dsa-rows">' + weak.map(function (p) { return dsaRowEl(p); }).join("") + "</div>" : empty("Nothing here.")) +
      sec("Recognition misses", "Drill statements you did not recognise.",
        misses.length ? "<ul>" + misses.map(function (id) {
          var g = DSA_S.drill[id];
          return '<li><a href="#" class="linkish" data-dsa-day="' + g.day + '" data-dsa-tab="dsa-today">' + esc(titleCase(id)) +
            '</a> <span class="muted tiny">Day ' + g.day + (g.guess ? " · you said: " + esc(g.guess) : "") + "</span></li>";
        }).join("") + "</ul>" : empty("No misses yet.")) +
      sec("Studied siblings", "For re-reading.",
        studied.length ? "<ul>" + studied.map(function (id) {
          var g = DSA_S.siblings[id];
          var parent = DSA_BY_ID[g.parent_id];
          return "<li>" + esc(titleCase(id)) + ' <span class="muted tiny">sibling of ' +
            (parent ? '<a href="#" class="linkish" data-dsa-goto="' + esc(parent.id) + '">' + esc(parent.title) + "</a>" : esc(g.parent_id)) +
            (g.studied_on ? " · " + esc(g.studied_on) : "") + "</span></li>";
        }).join("") + "</ul>" : empty("None studied yet."));
  }

  /* ------------------------------------------------------ Browse */

  function dsaFilterBar() {
    var f = DSAV.filters;
    function opts(name, values, label, show) {
      return '<label class="dsa-filt"><span>' + label + '</span><select data-dsa-filter="' + name + '">' +
        '<option value="">any</option>' +
        values.map(function (v) {
          return '<option value="' + esc(v) + '"' + (f[name] === String(v) ? " selected" : "") + ">" +
            esc(show ? show(v) : typeof v === "string" ? titleCase(v) : v) + "</option>";
        }).join("") + "</select></label>";
    }
    var topics = {}, tags = {};
    DSA_PROBLEMS.forEach(function (p) { topics[p.topic] = 1; });
    (DSA_PLAN.tag_seed || []).forEach(function (t) { tags[t] = 1; });
    for (var pid in DSA_S.problems) ((DSA_S.problems[pid] || {}).tags || []).forEach(function (t) { tags[t] = 1; });

    return '<div class="dsa-filters">' +
      '<label class="dsa-filt wide"><span>Search</span><input type="text" id="dsaQ" value="' + esc(f.q) +
        '" placeholder="title, topic or pattern"></label>' +
      opts("role", ["LEARN", "APPLY", "TWIST", "DISGUISE"], "Role", function (v) { return v; }) +
      opts("cluster", (DSA_PLAN.clusters || []).map(function (c) { return c.key; }), "Cluster", function (v) { return dsaCluster(v).title; }) +
      opts("topic", Object.keys(topics).sort(), "Topic") +
      opts("difficulty", ["Easy", "Medium", "Hard"], "Difficulty") +
      opts("status", DSA_PLAN.statuses || ["todo", "solved", "revisit", "skimmed"], "Status") +
      opts("content", ["ready", "pending"], "Notes") +
      opts("pseudocode", ["yes", "no"], "Pseudocode", function (v) { return v === "yes" ? "written" : "not written"; }) +
      opts("cut_state", ["skim", "queued"], "Cut") +
      opts("confidence", [1, 2, 3, 4, 5], "Confidence") +
      opts("tag", Object.keys(tags).sort(), "Tag") +
      '<label class="dsa-filt"><span>My notes</span><select data-dsa-filter="has_notes">' +
        '<option value="">any</option><option value="1"' + (f.has_notes === "1" ? " selected" : "") + ">has notes</option></select></label>" +
      '<button class="btn tiny" type="button" data-dsa-clear="1">clear</button></div>';
  }

  function dsaFiltered() {
    var f = DSAV.filters;
    var q = f.q.trim().toLowerCase();
    return DSA_PROBLEMS.filter(function (p) {
      var g = dsaRow(p.id);
      if (f.role && p.role !== f.role) return false;
      if (f.cluster && p.cluster !== f.cluster) return false;
      if (f.topic && p.topic !== f.topic) return false;
      if (f.difficulty && p.difficulty !== f.difficulty) return false;
      if (f.status && g.status !== f.status) return false;
      if (f.content && p.content !== f.content) return false;
      if (f.pseudocode === "yes" && !g.my_pseudocode.trim()) return false;
      if (f.pseudocode === "no" && g.my_pseudocode.trim()) return false;
      if (f.cut_state && g.cut_state !== f.cut_state) return false;
      if (f.tag && g.tags.indexOf(f.tag) === -1) return false;
      if (f.has_notes === "1" && !g.notes.trim()) return false;
      if (f.confidence && String(g.confidence) !== f.confidence) return false;
      if (q && p.title.toLowerCase().indexOf(q) === -1 &&
        p.topic.indexOf(q) === -1 && (p.pattern || "").indexOf(q) === -1) return false;
      return true;
    }).sort(function (a, b) { return a.day - b.day || a.ord - b.ord; });
  }

  function dsaBrowseCount(rows) {
    var st = dsaStats(rows);
    return rows.length + " matching · " + st.done + " done" +
      (st.revisit ? " (" + st.revisit + " to revisit)" : "") + " · " + st.starred + " starred";
  }

  function renderDsaBrowse() {
    var rows = dsaFiltered();
    return '<section class="card"><h2>Browse all ' + DSA_PROBLEMS.length + " problems</h2>" +
      dsaFilterBar() +
      '<div class="muted" id="dsaCount">' + dsaBrowseCount(rows) + "</div>" +
      '<div class="dsa-rows" id="dsaBrowseRows">' +
        (rows.length ? rows.map(function (p) { return dsaRowEl(p); }).join("") : '<div class="empty">Nothing matches those filters.</div>') +
      "</div></section>";
  }

  /* ------------------------------------------------------ binding */

  function cssEsc(s) {
    return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/[^\w-]/g, "\\$&");
  }

  function dsaGoto(id) {
    var p = DSA_BY_ID[id];
    if (!p) return;
    dsaCloseDrawer();
    SECTION = "dsa";
    ACTIVE = "dsa-today";
    DSAV.day = p.day;
    DSAV.openId = id;
    DSAV.revealed = {};
    DSAV.cover = false;
    DSA_AUTO_OPENED[p.day] = true;
    render();
    var el = document.querySelector('[data-dsa-row="' + cssEsc(id) + '"]');
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* Repaint just the open problem's panel, keeping the scroll position --
     used by reveal, cover and the ✍️ toggle, which change one panel and
     should not jump the page. */
  function dsaRepaintOpen() {
    var y = window.scrollY;
    if (DSAV.openId) dsaFillDetail(DSAV.openId);
    window.scrollTo(0, y);
  }

  function bindDsa() {
    document.querySelectorAll("[data-dsa-day]").forEach(function (b) {
      b.onclick = function (e) {
        e.preventDefault();
        var n = +b.dataset.dsaDay;
        DSAV.day = n === dsaTodayN() ? 0 : n;
        DSAV.openId = null;
        if (b.dataset.dsaTab) { SECTION = "dsa"; ACTIVE = b.dataset.dsaTab; }
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    });

    document.querySelectorAll("[data-dsa-tab]:not([data-dsa-day])").forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        SECTION = "dsa";
        ACTIVE = a.dataset.dsaTab;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    });

    document.querySelectorAll("[data-dsa-open]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.dsaOpen;
        // Keep the clicked row where it is while a tall row above it closes.
        var el = document.querySelector('[data-dsa-row="' + cssEsc(id) + '"]');
        var before = el ? el.getBoundingClientRect().top : null;
        DSAV.openId = DSAV.openId === id ? null : id;
        DSAV.revealed = {};
        DSAV.cover = false;
        render();
        if (before !== null) {
          var now = document.querySelector('[data-dsa-row="' + cssEsc(id) + '"]');
          if (now) {
            var drift = now.getBoundingClientRect().top - before;
            if (Math.abs(drift) > 1) window.scrollBy(0, drift);
          }
        }
      };
    });

    document.querySelectorAll("[data-dsa-reveal]").forEach(function (b) {
      b.onclick = function () { DSAV.revealed[b.dataset.dsaReveal] = true; dsaRepaintOpen(); };
    });
    document.querySelectorAll("[data-dsa-revealall]").forEach(function (b) {
      b.onclick = function () {
        var doc = DSA_CACHE.problem[DSAV.openId];
        (doc ? doc.stages : []).forEach(function (s) { DSAV.revealed[s.id] = true; });
        dsaRepaintOpen();
      };
    });
    document.querySelectorAll("[data-dsa-cover]").forEach(function (c) {
      c.onchange = function () {
        DSAV.cover = c.checked;
        if (c.checked) DSA_COVERABLE.forEach(function (s) { delete DSAV.revealed[s]; });
        dsaRepaintOpen();
      };
    });
    document.querySelectorAll("[data-dsa-writeonly]").forEach(function (c) {
      c.onchange = function () {
        DSAV.writeOnly = c.checked;
        dsaUiSave();
        var y = window.scrollY;
        if (DSAV.drawer) dsaOpenDrawer(DSAV.drawer.page, null);
        render();
        window.scrollTo(0, y);
      };
    });

    document.querySelectorAll("[data-dsa-status]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.dsaStatus;
        var order = dsaStatusOrder(id);
        var was = dsaRow(id).status;
        var next = order[(order.indexOf(was) + 1) % order.length];
        var patch = { status: next };
        // The timer's reading is what "minutes spent" means; it is only worth
        // anything the first time the problem leaves todo.
        if (was === "todo" && next !== "todo" && !dsaRow(id).first_done_at) {
          var started = DSAV.timers[id];
          patch.minutes_spent = started ? Math.max(0, Math.round((dsaNow() - started) / 60000)) : null;
          if (started) { delete DSAV.timers[id]; dsaUiSave(); }
        }
        dsaPatch(id, patch).then(function () { dsaMaybeKeep(); refreshBadges(stats()); render(); });
        if (was === "todo" && next !== "todo") markToday(1);
        if (was !== "todo" && next === "todo") markToday(-1);
        save();
        refreshBadges(stats());
        render();
      };
    });

    document.querySelectorAll("[data-dsa-star]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.dsaStar;
        dsaPatch(id, { revision: !dsaRow(id).revision });
        render();
      };
    });

    document.querySelectorAll("[data-dsa-conf]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.dsaConf;
        var n = +b.dataset.n;
        dsaPatch(id, { confidence: dsaRow(id).confidence === n ? null : n });
        render();
      };
    });

    document.querySelectorAll("[data-dsa-resolve]").forEach(function (b) {
      b.onclick = function () {
        b.disabled = true;
        dsaResolve(b.dataset.dsaResolve, +b.dataset.n).then(function () { dsaMaybeKeep(); render(); });
      };
    });

    document.querySelectorAll("[data-dsa-sib-open]").forEach(function (b) {
      b.onclick = function () {
        DSAV.openSib = DSAV.openSib === b.dataset.dsaSibOpen ? null : b.dataset.dsaSibOpen;
        if (DSAV.openId && document.querySelector('[data-dsa-detail="' + cssEsc(DSAV.openId) + '"] [data-dsa-sib-open="' + cssEsc(b.dataset.dsaSibOpen) + '"]')) dsaRepaintOpen();
        else render();
      };
    });
    document.querySelectorAll("[data-dsa-sib-studied],[data-dsa-sib-solved]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.dsaSibStudied || b.dataset.dsaSibSolved;
        var field = b.dataset.dsaSibStudied ? "studied" : "solved";
        var cur = DSA_S.siblings[id] || {};
        var patch = { parent_id: b.dataset.parent };
        patch[field] = !cur[field];
        dsaPatchSibling(id, patch);
        refreshBadges(stats());
        render();
        if (DSAV.openId) dsaFillDetail(DSAV.openId);
      };
    });

    document.querySelectorAll("[data-dsa-drillshow]").forEach(function (b) {
      b.onclick = function () { DSAV.drillShown[b.dataset.dsaDrillshow] = true; render(); };
    });
    document.querySelectorAll("[data-dsa-drillmark]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.dsaDrillmark;
        var v = b.dataset.v === "1";
        var cur = DSA_S.drill[id] || {};
        var guess = document.querySelector('[data-dsa-guess="' + cssEsc(id) + '"]');
        dsaPatchDrill(id, { day: +b.dataset.day, correct: cur.correct === v ? null : v, guess: guess ? guess.value : cur.guess || "" });
        render();
      };
    });
    document.querySelectorAll("[data-dsa-guess]").forEach(function (el) {
      el.onblur = function () {
        var id = el.dataset.dsaGuess;
        if ((DSA_S.drill[id] || {}).guess === el.value) return;
        dsaPatchDrill(id, { day: +el.dataset.day, guess: el.value });
      };
    });
    document.querySelectorAll("[data-dsa-dayflag]").forEach(function (c) {
      c.onchange = function () {
        var patch = {};
        patch[c.dataset.dsaDayflag] = c.checked;
        dsaPatchDay(+c.dataset.day, patch);
      };
    });

    document.querySelectorAll("[data-dsa-goto]").forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); dsaGoto(a.dataset.dsaGoto); };
    });

    /* A theory link from anywhere. Inside the Theory tab, or on a narrow
       screen, it navigates; from a problem on a wide screen it opens the
       drawer so the problem stays in view. */
    document.querySelectorAll("[data-dsa-th]").forEach(function (a) {
      a.onclick = function (e) {
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        var page = a.dataset.dsaTh, sec = a.dataset.dsaSec || null;
        if (!a.dataset.dsaFull && ACTIVE !== "dsa-theory" && dsaDrawerWide()) dsaOpenDrawer(page, sec);
        else dsaOpenTheory(page, sec);
      };
    });
    document.querySelectorAll("[data-dsa-drawer-close]").forEach(function (b) { b.onclick = dsaCloseDrawer; });
    document.querySelectorAll("[data-dsa-theory-back]").forEach(function (b) {
      b.onclick = function () { DSAV.theory = null; history.pushState(null, "", "#dsa/theory"); render(); };
    });
    document.querySelectorAll("[data-dsa-tview]").forEach(function (b) {
      b.onclick = function () { DSAV.theoryView = b.dataset.dsaTview; render(); };
    });
    var tq = document.getElementById("dsaTheoryQ");
    if (tq) {
      tq.oninput = function () {
        DSAV.theoryQ = tq.value;
        var host = document.getElementById("dsaTheoryList");
        if (host) { host.innerHTML = dsaTheoryList(); bindDsa(); }
      };
    }

    document.querySelectorAll("[data-copy]").forEach(function (b) {
      b.onclick = function () {
        var pre = document.getElementById(b.dataset.copy);
        if (!pre) return;
        var done = function () {
          b.textContent = "copied";
          setTimeout(function () { b.textContent = "copy"; }, 1400);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(pre.innerText).then(done, done);
        else {
          var ta = document.createElement("textarea");
          ta.value = pre.innerText;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (e2) { /* nothing else to try */ }
          document.body.removeChild(ta);
          done();
        }
      };
    });

    document.querySelectorAll("[data-dsa-start]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.dsaStart;
        if (DSAV.timers[id]) delete DSAV.timers[id];
        else DSAV.timers[id] = dsaNow();
        dsaUiSave();
        dsaRepaintOpen();
        dsaStartTick();
      };
    });

    /* Free text saves on blur, not per keystroke. */
    function textField(selector, prop, field) {
      document.querySelectorAll(selector).forEach(function (el) {
        el.onblur = function () {
          var id = el.dataset[prop];
          if (dsaRow(id)[field] === el.value) return;
          var patch = {};
          patch[field] = el.value;
          dsaPatch(id, patch);
        };
      });
    }
    textField("[data-dsa-notes]", "dsaNotes", "notes");
    textField("[data-dsa-approach]", "dsaApproach", "my_approach");
    textField("[data-dsa-goodnotes]", "dsaGoodnotes", "goodnotes_ref");
    textField("[data-dsa-pseudo]", "dsaPseudo", "my_pseudocode");

    document.querySelectorAll("[data-dsa-tag]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.dsaTag;
        var tag = b.dataset.tag;
        var tags = dsaRow(id).tags;
        var at = tags.indexOf(tag);
        if (at === -1) tags.push(tag); else tags.splice(at, 1);
        dsaPatch(id, { tags: tags });
        b.classList.toggle("on", at === -1);
      };
    });

    document.querySelectorAll("[data-dsa-newtag]").forEach(function (el) {
      el.onkeydown = function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        var id = el.dataset.dsaNewtag;
        var tag = el.value.trim().toLowerCase();
        if (!tag) return;
        var tags = dsaRow(id).tags;
        if (tags.indexOf(tag) === -1) tags.push(tag);
        el.value = "";
        dsaPatch(id, { tags: tags }).then(function () { dsaFillDetail(id); });
      };
    });

    document.querySelectorAll("[data-dsa-filter]").forEach(function (sel) {
      sel.onchange = function () { DSAV.filters[sel.dataset.dsaFilter] = sel.value; render(); };
    });

    var q = document.getElementById("dsaQ");
    if (q) {
      q.oninput = function () {
        DSAV.filters.q = q.value;
        var host = document.getElementById("dsaBrowseRows");
        if (!host) return;
        var rows = dsaFiltered();
        var count = document.getElementById("dsaCount");
        if (count) count.textContent = dsaBrowseCount(rows);
        host.innerHTML = rows.length ? rows.map(function (p) { return dsaRowEl(p); }).join("")
          : '<div class="empty">Nothing matches those filters.</div>';
        bindDsa();
      };
    }

    document.querySelectorAll("[data-dsa-help]").forEach(function (d) {
      d.ontoggle = function () { DSAV.help[d.dataset.dsaHelp] = d.open; dsaUiSave(); };
    });

    document.querySelectorAll("[data-dsa-clear]").forEach(function (b) {
      b.onclick = function () { for (var k in DSAV.filters) DSAV.filters[k] = ""; render(); };
    });
  }

  /* One interval for every running timer, started on demand and stopped once
     the last one is cleared. Only the ladder's classes move, so the notes
     box keeps its focus. */
  function dsaStartTick() {
    if (DSAV.tick) return;
    DSAV.tick = setInterval(function () {
      var any = false;
      document.querySelectorAll("[data-dsa-timer]").forEach(function (el) {
        var started = DSAV.timers[el.dataset.dsaTimer];
        if (!started) return;
        any = true;
        var mins = Math.floor((dsaNow() - started) / 60000);
        el.textContent = mins + " min elapsed";
        var panel = el.parentNode && el.parentNode.parentNode;
        if (!panel) return;
        var ladder = DSA_PLAN.stuck_ladder || [];
        panel.querySelectorAll(".dsa-ladder li").forEach(function (li, i) {
          var r = ladder[i];
          if (!r) return;
          li.className = mins >= r.from_min && mins < r.to_min ? "now" : mins >= r.to_min ? "past" : "";
        });
      });
      if (!any) { clearInterval(DSAV.tick); DSAV.tick = null; }
    }, 20000);
  }

  /* ====================================================================
     The OAs
     ====================================================================

     A timed mock assessment, modelled on the HackerRank screen because that
     is what campus OAs actually use and the familiarity is part of what is
     being trained.

     Three things here are deliberately unlike the rest of this file:

     - Nothing is cached. The sheet's content is static and cacheable; a
       mock's content is handed out per attempt and the answers never leave
       the Worker, so every screen here is a fetch.
     - The clock is the server's. `OAV.deadline` is derived from the
       `remaining_ms` the API reports and re-derived on every response, so a
       paused laptop or a fiddled system clock buys nothing.
     - The draft is local. Code is written to localStorage on every
       keystroke, because losing 40 minutes of work to a refresh is the one
       failure this screen must not have. */

  var OAV = {
    view: "list",      // list | attempt | review | history
    list: null,        // the mocks payload; null means "not fetched yet"
    inProgress: [],    // live attempts the server will still accept work for
    attemptId: null,
    mock: null,        // the attempt payload, without answers
    qid: null,         // the open problem
    state: {},         // per problem: submitted, marks, passed, total
    deadline: 0,       // ms epoch, from the server's remaining_ms
    expired: false,
    runner: null,
    langs: [],
    lang: "cpp",
    results: {},       // per problem: the last run or submit result
    busy: "",          // "run" | "submit" | "finish", for the button states
    review: null,
    history: null,
    error: ""
  };

  var OA_TIMER = null;
  var OA_DRAFT = "launch-console-oa-draft-v1";

  function oaDrafts() {
    try { return JSON.parse(localStorage.getItem(OA_DRAFT) || "{}") || {}; } catch (e) { return {}; }
  }
  function oaDraft(attemptId, qid) {
    var all = oaDrafts();
    var one = all[attemptId + ":" + qid];
    return one && typeof one.code === "string" ? one : null;
  }
  function oaSaveDraft(attemptId, qid, code, lang) {
    var all = oaDrafts();
    all[attemptId + ":" + qid] = { code: code, lang: lang, at: Date.now() };
    /* Drafts are only ever useful for the attempt you are in. Keeping the
       last 40 keys bounds the thing without a cleanup pass that would have
       to know which attempts are finished. */
    var keys = Object.keys(all);
    if (keys.length > 40) {
      keys.sort(function (a, b) { return (all[a].at || 0) - (all[b].at || 0); });
      keys.slice(0, keys.length - 40).forEach(function (k) { delete all[k]; });
    }
    try { localStorage.setItem(OA_DRAFT, JSON.stringify(all)); } catch (e) { /* full or blocked */ }
  }

  var OA_STARTER = {
    cpp:
      "#include <bits/stdc++.h>\nusing namespace std;\n\n" +
      "int main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    return 0;\n}\n",
    python: "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n\n\nmain()\n"
  };

  function oaClock(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function oaRemaining() {
    return Math.max(0, OAV.deadline - Date.now());
  }

  /* Every response carries the server's remaining_ms. Rebasing the local
     deadline on each one means the countdown can drift between calls but
     never past the next one, and the submit endpoint is the authority
     regardless of what the display says. */
  function oaSync(payload) {
    if (payload && typeof payload.remaining_ms === "number") {
      OAV.deadline = Date.now() + payload.remaining_ms;
      OAV.expired = payload.remaining_ms <= 0;
    }
    if (payload && payload.runner) OAV.runner = payload.runner;
    if (payload && payload.langs) OAV.langs = payload.langs;
    if (payload && payload.state) OAV.state = payload.state;
  }

  function oaStopTimer() {
    if (OA_TIMER) { clearInterval(OA_TIMER); OA_TIMER = null; }
  }

  /* The countdown repaints one element rather than calling render(), because
     a full repaint once a second would throw away the editor's cursor. */
  function oaStartTimer() {
    oaStopTimer();
    OA_TIMER = setInterval(function () {
      var el = document.querySelector("[data-oa-clock]");
      if (!el) { oaStopTimer(); return; }
      var left = oaRemaining();
      el.textContent = oaClock(left);
      el.className = "oa-clock" + (left <= 5 * 60000 ? " red" : left <= 15 * 60000 ? " amber" : "");
      if (left <= 0 && !OAV.expired) {
        OAV.expired = true;
        /* Time is up. The attempt is not auto-finished behind your back --
           that would discard a problem you were about to submit without
           anything on screen saying so -- but everything stops accepting
           work and the only button left is the one that ends it. */
        render();
      }
    }, 1000);
  }

  // ------------------------------------------------------------ the list

  function renderDsaOa() {
    if (OAV.view === "attempt") return oaAssessment();
    if (OAV.view === "review") return oaReview();
    if (OAV.view === "history") return oaHistory();
    return oaList();
  }

  function oaHelpPanel() {
    return dsaHelp("oa", "What an OA is for, and how this one is scored",
      "<p>The sheet asks whether you can solve a problem <i>when you already know which " +
      "pattern it is</i>. A real assessment never tells you that. It wraps a known pattern " +
      "in an unfamiliar story, gives you ninety minutes for three problems, and says nothing " +
      "about where they came from. That gap — recognition under time pressure, with no label " +
      "— is the only thing this tab trains.</p>" +

      "<p><b>Mocks are on fixed dates</b>, shown from Day 1 in the header. Each covers every plan " +
      "day before it, done or not — if you are behind, you get a warning, never a lock. On the " +
      "morning, at 08:45 IST, the exact unlock time is drawn (somewhere between 09:00 and 17:00) " +
      "and emailed. From the unlock you have <b>three hours to start</b>; once started, the usual " +
      "clock runs. A window that passes without a start is recorded as <b>missed</b>, and the mock " +
      "stays available as an unscored <b>practice</b> attempt — as does any mock after its scored " +
      "attempt.</p>" +

      "<h5>During the attempt</h5>" +
      dl([
        ["<b>The clock</b>",
         "Ninety minutes, counted by the server from the moment you start. Closing the tab, " +
         "reloading, or shutting the laptop does not pause it — that is the point. It turns " +
         "amber under fifteen minutes and red under five."],
        ["<b>Run Code</b>",
         "Runs your code against the <i>sample</i> cases only, and shows you exactly what it " +
         "printed next to what was expected. Samples are worth <b>zero marks</b>. They exist " +
         "so you can catch a format mistake before spending your one submission."],
        ["<b>Submit</b>",
         "Grades against the hidden tests and <b>locks the problem</b>. There is no second " +
         "attempt, which is what makes the time pressure real. You see which tests passed and " +
         "what each was checking, never their input or expected output."],
        ["<b>Partial credit</b>",
         "Every hidden test carries its own marks, so a solution that handles the ordinary " +
         "cases and misses the edge ones scores accordingly. A program that does not compile " +
         "scores zero and shows you the compiler's own message — it is not graded as a wrong " +
         "answer."]
      ]) +

      "<h5>What is hidden, and why</h5>" +
      "<p>While the clock is running, the page is not told the pattern, the topic, the day a " +
      "problem came from, or which sheet problem teaches it. None of that is merely hidden in " +
      "the interface — it never leaves the server until you finish, because a page that knows " +
      "the answer is a page you can read the answer out of.</p>" +

      "<h5>Afterwards</h5>" +
      "<p>The review names the pattern each problem was diagnosing, the intended approach and " +
      "complexity, and the wrong turn most people take, with a link back to the sheet problem " +
      "that teaches it. <b>Anything you attempted and did not finish is written straight back " +
      "into your revision queue</b> at confidence 2 — so a mock reorders what you practise " +
      "next without you transcribing anything. It never raises a confidence you set yourself: " +
      "ninety minutes is good evidence that you do not know something and poor evidence that " +
      "you do.</p>");
  }

  function oaRunnerNote() {
    if (!OAV.runner || OAV.runner.ready) return "";
    return '<div class="oa-warn"><b>No code runner is configured.</b><p>' +
      esc(OAV.runner.reason) + "</p><p>You can still read the problems and write solutions — " +
      "<i>Run Code</i> and <i>Submit</i> are what need it.</p></div>";
  }

  var OA_STATE_LABEL = {
    scheduled: "scheduled", revealed: "unlock time set", unlocked: "open now",
    started: "in progress", submitted: "taken", missed: "missed"
  };

  /* One card per scheduled mock, content or not. What the card offers is
     the server's decision (scored inside the window, practice after it,
     locked before it) -- this only labels it. */
  function oaCard(sched, content, live) {
    var today = dsaToday();
    var left = DSA_CORE.daysBetween(today, sched.date);
    var label = dsaMockLabel(sched);
    var days = sched.covers_days.length ? "days " + sched.covers_days[0] + "–" + sched.covers_days[sched.covers_days.length - 1] : "";
    var times = sched.unlock_at
      ? '<p class="oa-times">Unlocks <b>' + DSA_CORE.istClock(sched.unlock_at) + "</b> · start by <b>" +
        DSA_CORE.istClock(sched.window_closes) + "</b> IST</p>"
      : sched.state === "scheduled" && left >= 0
        ? '<p class="muted tiny">The unlock time is drawn and emailed at 08:45 IST on ' + esc(dsaShortDate(sched.date)) + ".</p>"
        : "";
    var warn = sched.unfinished && left <= 2 && (sched.state === "scheduled" || sched.state === "revealed" || sched.state === "unlocked")
      ? '<p class="oa-unmet">You have ' + sched.unfinished + " unfinished problem" + (sched.unfinished === 1 ? "" : "s") +
        " from " + esc(days) + ". Take it anyway — it is a diagnostic of where you are, not a gate.</p>" : "";
    var late = !content && left <= 3
      ? '<p class="oa-unmet">This mock\'s problems have not landed yet — the content batch is late.</p>' : "";

    var action;
    if (!content) action = '<button class="btn" type="button" disabled>Content pending</button>';
    else if (live && live.mock_id === sched.id) action = '<button class="btn" data-oa-resume="' + live.id + '" type="button">Resume it</button>';
    else if (sched.state === "unlocked") action = '<button class="btn" data-oa-start="' + esc(sched.id) + '" type="button">Start the scored attempt</button>';
    else if (sched.state === "missed" || sched.state === "submitted") {
      action = '<button class="btn ghost" data-oa-start="' + esc(sched.id) + '" type="button">Take as practice (unscored)</button>';
    } else action = '<button class="btn" type="button" disabled>Locked</button>';

    return '<div class="oa-card st-' + esc(sched.state) + '">' +
      '<div class="oa-card-hd"><h4>' + esc(label) + "</h4>" +
        '<span class="oa-chip st">' + esc(OA_STATE_LABEL[sched.state] || sched.state) + "</span>" +
        '<span class="oa-chip">' + esc(dsaShortDate(sched.date)) + (left > 0 ? " · in " + left + " day" + (left === 1 ? "" : "s") : left === 0 ? " · today" : "") + "</span>" +
        '<span class="oa-chip">' + sched.duration_min + " min</span>" +
        (content ? '<span class="oa-chip">' + content.problem_count + " problems · " + content.total_marks + " marks</span>" : "") +
        (sched.score !== null && sched.score !== undefined ? '<span class="oa-chip">scored ' + sched.score + "</span>" : "") +
      "</div>" +
      '<p class="muted">Covers ' + esc(days) + " of the plan" + (sched.kind === "grand" ? " — the grand mock" : "") + ".</p>" +
      times + warn + late + action + "</div>";
  }

  function oaList() {
    var data = OAV.list || null;
    if (OAV.error) {
      return '<div class="card"><h3>Online assessments</h3><p class="muted">' + esc(OAV.error) + "</p></div>";
    }
    if (!data) return '<div class="card"><h3>Online assessments</h3><p class="muted">Loading…</p></div>';

    var live = (OAV.inProgress || [])[0];
    var contentById = {};
    (data.mocks || []).forEach(function (m) { contentById[m.id] = m; });
    var cards = (data.schedule || []).map(function (s) { return oaCard(s, contentById[s.id], live); }).join("");

    return '<div class="card">' +
      "<h3>Online assessments</h3>" +
      '<p class="muted">Fixed dates, a random unlock time on the day, three hours to start, then ' +
        "a clock that does not stop. No hints, no pattern names.</p>" +
      oaHelpPanel() +
      oaRunnerNote() +
      (live && !(data.schedule || []).some(function (s) { return s.id === live.mock_id; })
        ? '<div class="oa-resume"><b>You have an attempt in progress.</b> ' +
          '<button class="btn" data-oa-resume="' + live.id + '" type="button">Resume it</button></div>'
        : "") +
      '<div class="oa-cards">' + cards + "</div>" +
      '<p class="oa-histlink"><a href="#" data-oa-history="1">Past attempts and per-pattern accuracy →</a></p>' +
    "</div>";
  }

  // ------------------------------------------------------ the assessment

  function oaProblem() {
    if (!OAV.mock) return null;
    return OAV.mock.problems.find(function (q) { return q.id === OAV.qid; }) || OAV.mock.problems[0];
  }

  function oaAssessment() {
    if (!OAV.mock) return '<div class="card"><p class="muted">Loading the assessment…</p></div>';

    var q = oaProblem();
    var left = oaRemaining();
    var scored = OAV.mock.problems.reduce(function (n, p) {
      return n + ((OAV.state[p.id] && OAV.state[p.id].marks) || 0);
    }, 0);
    var done = OAV.mock.problems.every(function (p) {
      return OAV.state[p.id] && OAV.state[p.id].submitted;
    });

    var tabs = OAV.mock.problems.map(function (p) {
      var st = OAV.state[p.id] || {};
      return '<button class="oa-qtab' + (p.id === q.id ? " on" : "") + (st.submitted ? " done" : "") +
        '" data-oa-q="' + esc(p.id) + '" type="button">Q' + p.ord +
        (st.submitted ? ' <span class="oa-tick">✓</span>' : "") + "</button>";
    }).join("");

    return '<div class="oa-screen">' +
      '<div class="oa-bar">' +
        '<div class="oa-bar-l"><span class="oa-title">' + esc(OAV.mock.title) + "</span>" + tabs + "</div>" +
        '<div class="oa-bar-r">' +
          '<span class="oa-marks">' + scored + " / " + OAV.mock.total_marks + " marks</span>" +
          '<span class="oa-clock' + (left <= 5 * 60000 ? " red" : left <= 15 * 60000 ? " amber" : "") +
            '" data-oa-clock="1">' + oaClock(left) + "</span>" +
          '<button class="btn tiny" data-oa-finish="1" type="button">' +
            (done || OAV.expired ? "Finish and see the review" : "Finish early") + "</button>" +
        "</div>" +
      "</div>" +

      (OAV.expired
        ? '<div class="oa-expired">Time is up. Nothing further can be submitted — finish to see ' +
          "the review.</div>"
        : "") +

      '<div class="oa-panes">' +
        '<div class="oa-statement">' + oaStatement(q) + "</div>" +
        '<div class="oa-editor-wrap">' + oaEditor(q) + "</div>" +
      "</div>" +
    "</div>";
  }

  function oaStatement(q) {
    var samples = (q.samples || []).map(function (s, i) {
      return '<div class="oa-sample"><h5>Sample ' + (i + 1) + "</h5>" +
        '<div class="oa-io"><div><span class="oa-iolab">Input</span><pre>' + esc(s.input) + "</pre></div>" +
        '<div><span class="oa-iolab">Output</span><pre>' + esc(s.output) + "</pre></div></div>" +
        (s.explanation ? '<p class="oa-expl">' + mdInline(s.explanation) + "</p>" : "") +
      "</div>";
    }).join("");

    var st = OAV.state[q.id] || {};

    return '<div class="oa-qhead"><h3>' + esc(q.title) + "</h3>" +
        '<span class="dsa-diff d-' + esc(String(q.difficulty).toLowerCase()) + '">' +
          esc(q.difficulty) + "</span>" +
        '<span class="oa-chip">' + q.marks + " marks</span>" +
        '<span class="oa-chip">' + q.hidden_count + " hidden tests</span>" +
        (st.submitted ? '<span class="oa-locked">submitted — ' + st.marks + "/" + q.marks + "</span>" : "") +
      "</div>" +
      '<div class="oa-body">' + md(q.statement) + "</div>" +
      '<div class="oa-fmt"><h5>Input</h5>' + md(q.input_format) + "</div>" +
      '<div class="oa-fmt"><h5>Output</h5>' + md(q.output_format) + "</div>" +
      '<div class="oa-fmt"><h5>Constraints</h5>' + md(q.constraints) + "</div>" +
      samples;
  }

  function oaEditor(q) {
    var st = OAV.state[q.id] || {};
    var saved = oaDraft(OAV.attemptId, q.id);
    var code = saved ? saved.code : (OA_STARTER[OAV.lang] || "");
    var locked = !!st.submitted || OAV.expired;

    var langs = (OAV.langs.length ? OAV.langs : [{ id: "cpp", label: "C++17" }]).map(function (l) {
      return '<option value="' + esc(l.id) + '"' + (l.id === OAV.lang ? " selected" : "") + ">" +
        esc(l.label) + "</option>";
    }).join("");

    return '<div class="oa-etop">' +
        '<select class="oa-lang" data-oa-lang="1"' + (locked ? " disabled" : "") + ">" + langs + "</select>" +
        '<span class="oa-esave" data-oa-saved="1"></span>' +
      "</div>" +
      '<div class="oa-code' + (locked ? " locked" : "") + '">' +
        '<div class="oa-gutter" data-oa-gutter="1"></div>' +
        '<div class="oa-codearea">' +
          '<pre class="oa-hl" data-oa-hl="1" aria-hidden="true"></pre>' +
          '<textarea class="oa-ta" data-oa-code="' + esc(q.id) + '" spellcheck="false" ' +
            'autocapitalize="off" autocomplete="off"' + (locked ? " readonly" : "") + ">" +
            esc(code) + "</textarea>" +
        "</div>" +
      "</div>" +
      '<div class="oa-strip">' +
        '<button class="btn tiny" data-oa-run="1" type="button"' +
          (locked || OAV.busy ? " disabled" : "") + ">" +
          (OAV.busy === "run" ? "Running…" : "Run Code") + "</button>" +
        '<button class="btn tiny primary" data-oa-submit="1" type="button"' +
          (locked || OAV.busy ? " disabled" : "") + ">" +
          (OAV.busy === "submit" ? "Grading…" : st.submitted ? "Submitted" : "Submit") + "</button>" +
        '<span class="oa-striphint">' +
          (locked
            ? "This problem is locked."
            : "Run checks the samples and costs nothing. Submit grades the hidden tests and locks it.") +
        "</span>" +
      "</div>" +
      '<div class="oa-results">' + oaResults(q) + "</div>";
  }

  function oaResults(q) {
    var r = OAV.results[q.id];
    if (!r) return "";

    if (r.error) return '<div class="oa-warn"><b>Could not run your code.</b><p>' + esc(r.error) + "</p></div>";

    if (r.compile_error) {
      return '<div class="oa-compile"><h5>Compilation failed</h5><pre>' + esc(r.compile_error) + "</pre>" +
        '<p class="muted">Zero marks, and not counted as a wrong answer — the compiler’s own ' +
        "message is above, verbatim.</p></div>";
    }

    if (r.kind === "run") {
      return '<table class="oa-table"><thead><tr><th>Sample</th><th>Verdict</th><th>Expected</th>' +
        "<th>Your output</th></tr></thead><tbody>" +
        r.tests.map(function (t, i) {
          return "<tr><td>" + (i + 1) + '</td><td><span class="oa-v ' + esc(t.verdict) + '">' +
            esc(t.verdict) + "</span></td><td><pre>" + esc(t.expected) + "</pre></td>" +
            "<td><pre>" + esc(t.got || (t.stderr ? "(stderr) " + t.stderr : "")) + "</pre></td></tr>";
        }).join("") + "</tbody></table>";
    }

    /* A submit result. The test's description is shown and its data is not:
       printing what a hidden test fed in, or what it expected back, would
       give the whole set away over two or three submissions. */
    return '<div class="oa-scored"><b>' + r.marks + " / " + r.out_of + " marks</b> · " +
        r.passed + " of " + r.total + " hidden tests passed</div>" +
      '<table class="oa-table"><thead><tr><th>Test</th><th>Marks</th><th>Verdict</th><th>Time</th>' +
      "</tr></thead><tbody>" +
      r.tests.map(function (t) {
        return "<tr><td>" + esc(t.desc) + "</td><td>" + t.earned + " / " + t.marks + "</td>" +
          '<td><span class="oa-v ' + esc(t.verdict) + '">' + esc(t.verdict) + "</span></td>" +
          "<td>" + (t.time_ms == null ? "—" : t.time_ms + " ms") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  // ---------------------------------------------------------- the review

  function oaReview() {
    var r = OAV.review;
    if (!r) return '<div class="card"><p class="muted">Loading the review…</p></div>';

    var byId = {};
    r.review.problems.forEach(function (q) { byId[q.id] = q; });

    var problems = r.mock.problems.map(function (q) {
      var rev = byId[q.id] || {};
      var got = r.per_problem[q.id] || {};
      var sheet = DSA_BY_ID[rev.related];

      return '<div class="oa-rev">' +
        '<div class="oa-rev-hd"><h4>Q' + q.ord + " · " + esc(q.title) + "</h4>" +
          '<span class="oa-chip">' + (got.marks || 0) + " / " + q.marks + " marks</span>" +
          (got.submitted
            ? '<span class="oa-chip">' + (got.passed || 0) + "/" + (got.total || 0) + " tests</span>" +
              (got.minutes != null ? '<span class="oa-chip">at ' + got.minutes + " min</span>" : "")
            : '<span class="oa-chip warn">not submitted</span>') +
        "</div>" +

        '<div class="dsa-lblock"><h4>What it was diagnosing</h4>' +
          '<p><span class="dsa-pattern">' + esc(rev.tests_pattern || "—") + "</span>" +
          (rev.source_day ? ' <span class="muted">— day ' + rev.source_day + " of the sheet</span>" : "") +
          "</p></div>" +

        '<div class="dsa-lblock"><h4>The intended approach</h4>' + md(rev.intended_approach || "") +
          (rev.intended_complexity
            ? '<p class="oa-cx">' + mdInline(rev.intended_complexity) + "</p>" : "") + "</div>" +

        '<div class="dsa-lblock"><h4>The common wrong turn</h4>' + md(rev.common_wrong_turn || "") + "</div>" +

        (sheet
          ? '<div class="dsa-lblock"><h4>On the sheet</h4><p><a href="#" data-dsa-goto="' +
            esc(rev.related) + '">' + esc(sheet.title) + "</a> teaches this pattern" +
            ((got.marks || 0) < q.marks
              ? " — and has just been flagged for revision at confidence 2."
              : ".") + "</p></div>"
          : "") +

        (got.code
          ? '<div class="dsa-lblock"><h4>What you wrote</h4>' + mdCode(got.code, got.lang || "cpp") + "</div>"
          : "") +

        (got.tests && got.tests.length
          ? '<div class="dsa-lblock"><h4>Tests</h4><table class="oa-table"><tbody>' +
            got.tests.map(function (t) {
              return "<tr><td>" + esc(t.desc) + "</td><td>" + t.earned + " / " + t.marks + "</td>" +
                '<td><span class="oa-v ' + esc(t.verdict) + '">' + esc(t.verdict) + "</span></td></tr>";
            }).join("") + "</tbody></table></div>"
          : "") +
      "</div>";
    }).join("");

    var mins = Math.round((r.ended_at - r.started_at) / 60);

    return '<div class="card">' +
      '<div class="oa-score-hd">' +
        "<h3>" + esc(r.mock.title) + " — review</h3>" +
        '<div class="oa-bigscore b-' + esc(r.band.key) + '">' + r.score + " <span>/ " + r.total_marks + "</span></div>" +
      "</div>" +
      '<div class="oa-band b-' + esc(r.band.key) + '"><b>' + esc(r.band.reading) + ".</b> " +
        esc(r.band.action) + "</div>" +
      '<p class="muted">Finished in ' + mins + " minutes" + (r.kind === "practice" ? " · practice attempt, unscored" : "") + ".</p>" +
      '<div class="dsa-lblock"><h4>Explain your approach (2 minutes)</h4>' +
        '<p class="muted tiny">Out loud, then here: the pattern you saw in each problem, the approach, and its complexity — ' +
        "what an interviewer would ask you to say.</p>" +
        '<textarea data-oa-notes="' + r.attempt_id + '" rows="5" placeholder="Q1: … Q2: … Q3: …">' + esc(r.notes || "") + "</textarea></div>" +
      problems +
      '<p class="oa-histlink"><a href="#" data-oa-back="1">← Back to the assessments</a> · ' +
        '<a href="#" data-oa-history="1">Past attempts →</a></p>' +
    "</div>";
  }

  // --------------------------------------------------------- the history

  function oaHistory() {
    var h = OAV.history;
    if (!h) return '<div class="card"><p class="muted">Loading…</p></div>';

    if (!h.attempts.length) {
      return '<div class="card"><h3>Past attempts</h3>' +
        '<p class="muted">Nothing finished yet.</p>' +
        '<p class="oa-histlink"><a href="#" data-oa-back="1">← Back to the assessments</a></p></div>';
    }

    var rows = h.attempts.map(function (a) {
      return "<tr>" +
        '<td><a href="#" data-oa-review="' + a.id + '">' + esc(a.mock_title) + "</a>" +
          (a.kind === "practice" ? ' <span class="oa-chip">practice</span>' : "") + "</td>" +
        "<td>" + esc(new Date(a.started_at * 1000).toISOString().slice(0, 10)) + "</td>" +
        '<td><b>' + a.score + "</b> / " + a.total_marks + "</td>" +
        '<td><span class="oa-bandtag b-' + esc(a.band.key) + '">' + esc(a.band.reading) + "</span></td>" +
      "</tr>";
    }).join("");

    /* The number the history is actually for. One mock tells you whether you
       had a bad morning; the same pattern missed three times is a gap, and
       this is the only screen that can show the difference. */
    var pats = h.patterns.map(function (p) {
      var sheet = DSA_BY_ID[p.related];
      return '<li><span class="oa-patbar"><i style="width:' + p.percent + '%"></i></span>' +
        '<span class="dsa-pattern">' + esc(p.pattern) + "</span>" +
        '<span class="oa-patpct">' + p.percent + "%</span>" +
        '<span class="muted tiny">' + p.earned + "/" + p.out_of + " marks over " + p.attempts +
          (p.attempts === 1 ? " attempt" : " attempts") + "</span>" +
        (sheet ? ' <a href="#" data-dsa-goto="' + esc(p.related) + '">' + esc(sheet.title) + "</a>" : "") +
      "</li>";
    }).join("");

    return '<div class="card">' +
      "<h3>Past attempts</h3>" +
      '<table class="oa-table"><thead><tr><th>Mock</th><th>Taken</th><th>Score</th><th>Reading</th>' +
      "</tr></thead><tbody>" + rows + "</tbody></table>" +
      "<h4>Accuracy by pattern</h4>" +
      '<p class="muted">Weakest first, across every attempt. This is the list worth acting on — ' +
        "a single bad score is a bad morning, the same pattern three times is a gap.</p>" +
      '<ul class="oa-pats">' + pats + "</ul>" +
      '<p class="oa-histlink"><a href="#" data-oa-back="1">← Back to the assessments</a></p>' +
    "</div>";
  }

  // ------------------------------------------------------------- actions

  function oaLoadList() {
    return api("/api/oa/mocks").then(function (d) {
      OAV.list = d;
      dsaAdoptSchedule(d.schedule);
      OAV.inProgress = d.in_progress || [];
      OAV.runner = d.runner;
      OAV.langs = d.langs || [];
      OAV.error = "";
    }).catch(function (e) {
      OAV.error = "Could not load the assessments: " + e.message;
    }).then(function () {
      if (ACTIVE === "dsa-oa") render();
    });
  }

  function oaEnterAttempt(d) {
    OAV.attemptId = d.attempt_id;
    OAV.mock = d.mock;
    OAV.qid = (d.mock.problems[0] || {}).id;
    OAV.results = {};
    OAV.view = "attempt";
    oaSync(d);
    if (!d.state) {
      OAV.state = {};
      d.mock.problems.forEach(function (q) {
        OAV.state[q.id] = { submitted: false, marks: 0, passed: 0, total: 0 };
      });
    }
    render();
  }

  function oaStart(mockId) {
    api("/api/oa/attempt", { method: "POST", body: JSON.stringify({ mock_id: mockId }) })
      .then(oaEnterAttempt)
      .catch(function (e) { toast(e.message); oaLoadList(); });
  }

  function oaResume(id) {
    api("/api/oa/attempt/" + id).then(function (d) {
      if (d.ended_at) { oaOpenReview(id); return; }
      oaEnterAttempt(d);
    }).catch(function (e) { toast(e.message); });
  }

  function oaCurrentCode() {
    var ta = document.querySelector("[data-oa-code]");
    return ta ? ta.value : "";
  }

  function oaRun() {
    var q = oaProblem();
    if (!q) return;
    OAV.busy = "run";
    render();
    api("/api/oa/attempt/" + OAV.attemptId + "/run", {
      method: "POST",
      body: JSON.stringify({ problem_id: q.id, source: oaCurrentCode(), lang: OAV.lang })
    }).then(function (d) {
      OAV.results[q.id] = { kind: "run", tests: d.tests || [], compile_error: d.compile_error, error: d.error };
    }).catch(function (e) {
      OAV.results[q.id] = { kind: "run", tests: [], error: e.message };
    }).then(function () {
      OAV.busy = "";
      render();
    });
  }

  function oaSubmit() {
    var q = oaProblem();
    if (!q) return;
    /* The one confirm in the tab. Submitting is irreversible by design and
       there is no second attempt, so a misplaced click should not cost the
       problem. */
    if (!window.confirm("Submit Q" + q.ord + "? This grades it against the hidden tests and " +
        "locks it — there is no second submission.")) return;

    OAV.busy = "submit";
    render();
    api("/api/oa/attempt/" + OAV.attemptId + "/submit/" + encodeURIComponent(q.id), {
      method: "POST",
      body: JSON.stringify({ source: oaCurrentCode(), lang: OAV.lang })
    }).then(function (d) {
      OAV.results[q.id] = {
        kind: "submit", marks: d.marks, out_of: d.out_of, passed: d.passed,
        total: d.total, tests: d.tests || [], compile_error: d.compile_error
      };
      OAV.state[q.id] = { submitted: true, marks: d.marks, passed: d.passed, total: d.total };
    }).catch(function (e) {
      // A backend failure is not a zero and does not lock anything.
      OAV.results[q.id] = { kind: "submit", tests: [], error: e.message };
    }).then(function () {
      OAV.busy = "";
      render();
    });
  }

  function oaFinish() {
    var unsubmitted = OAV.mock.problems.filter(function (q) {
      return !(OAV.state[q.id] && OAV.state[q.id].submitted);
    });
    if (unsubmitted.length && !OAV.expired) {
      if (!window.confirm("Finish now? " + unsubmitted.length +
          (unsubmitted.length === 1 ? " problem has" : " problems have") +
          " not been submitted and will score zero.")) return;
    }
    OAV.busy = "finish";
    render();
    api("/api/oa/attempt/" + OAV.attemptId + "/finish", { method: "POST" })
      .then(function (d) {
        oaStopTimer();
        /* The write-back has already happened server-side. Refreshing the
           local progress cache is what makes the sheet show the new
           confidence and revision flags without a reload. */
        if ((d.revision_queue || []).length) {
          toast(d.revision_queue.length + " problem(s) flagged for revision");
          /* The write-back happened server-side, so the local cache is now
             a version behind on exactly the rows the review is about to
             link to. Pulling once here is what makes the sheet show the new
             confidence without a reload. */
          dsaSyncFromServer();
        }
        return oaOpenReview(OAV.attemptId);
      })
      .catch(function (e) { toast(e.message); })
      .then(function () { OAV.busy = ""; render(); });
  }

  function oaOpenReview(id) {
    return api("/api/oa/attempt/" + id + "/review").then(function (d) {
      OAV.review = d;
      OAV.view = "review";
      OAV.mock = null;
      oaStopTimer();
      render();
    }).catch(function (e) { toast(e.message); });
  }

  function oaOpenHistory() {
    OAV.view = "history";
    render();
    api("/api/oa/history").then(function (d) {
      OAV.history = d;
      if (ACTIVE === "dsa-oa") render();
    }).catch(function (e) { toast(e.message); });
  }

  // -------------------------------------------------------------- the editor

  /* A textarea with a highlighted <pre> behind it, which is the only way to
     get syntax colour without either a CDN dependency or a contenteditable
     div that fights the browser over newlines. The two must agree exactly on
     font, size, padding and wrapping or the text drifts apart, which is what
     the shared .oa-ta/.oa-hl rules in the stylesheet are for. */
  function oaPaintEditor() {
    var ta = document.querySelector("[data-oa-code]");
    var hl = document.querySelector("[data-oa-hl]");
    var gutter = document.querySelector("[data-oa-gutter]");
    if (!ta || !hl) return;

    var code = ta.value;
    /* A trailing newline would collapse in the <pre> and leave the last line
       unhighlighted while the textarea still shows it. */
    hl.innerHTML = (OAV.lang === "cpp" ? highlightCpp(code) : esc(code)) + "\n";

    if (gutter) {
      var lines = code.split("\n").length;
      var nums = "";
      for (var i = 1; i <= lines; i++) nums += i + "\n";
      gutter.textContent = nums;
    }
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
    if (gutter) gutter.scrollTop = ta.scrollTop;
  }

  function bindOa() {
    document.querySelectorAll("[data-oa-notes]").forEach(function (ta) {
      ta.onblur = function () {
        var id = ta.dataset.oaNotes;
        if (OAV.review && OAV.review.notes === ta.value) return;
        api("/api/oa/attempt/" + id + "/notes", { method: "PATCH", body: JSON.stringify({ notes: ta.value }) })
          .then(function (d) { if (OAV.review) OAV.review.notes = d.notes; toast("Explanation saved."); })
          .catch(function (e) { toast("Not saved: " + e.message); });
      };
    });
    document.querySelectorAll("[data-oa-start]").forEach(function (b) {
      b.onclick = function () { oaStart(b.dataset.oaStart); };
    });
    document.querySelectorAll("[data-oa-resume]").forEach(function (b) {
      b.onclick = function () { oaResume(Number(b.dataset.oaResume)); };
    });
    document.querySelectorAll("[data-oa-q]").forEach(function (b) {
      b.onclick = function () { OAV.qid = b.dataset.oaQ; render(); };
    });
    document.querySelectorAll("[data-oa-run]").forEach(function (b) { b.onclick = oaRun; });
    document.querySelectorAll("[data-oa-submit]").forEach(function (b) { b.onclick = oaSubmit; });
    document.querySelectorAll("[data-oa-finish]").forEach(function (b) { b.onclick = oaFinish; });

    document.querySelectorAll("[data-oa-history]").forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); oaOpenHistory(); };
    });
    document.querySelectorAll("[data-oa-review]").forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); oaOpenReview(Number(a.dataset.oaReview)); };
    });
    document.querySelectorAll("[data-oa-back]").forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        OAV.view = "list"; OAV.review = null; OAV.mock = null;
        render();
        oaLoadList();
      };
    });

    var lang = document.querySelector("[data-oa-lang]");
    if (lang) {
      lang.onchange = function () {
        OAV.lang = lang.value;
        var q = oaProblem();
        /* Switching language on an untouched buffer swaps the starter in;
           switching it on work in progress leaves the work alone. */
        var ta = document.querySelector("[data-oa-code]");
        if (ta && q) {
          var untouched = Object.keys(OA_STARTER).some(function (k) {
            return ta.value.trim() === (OA_STARTER[k] || "").trim();
          });
          if (untouched) ta.value = OA_STARTER[OAV.lang] || "";
          oaSaveDraft(OAV.attemptId, q.id, ta.value, OAV.lang);
        }
        render();
      };
    }

    var ta = document.querySelector("[data-oa-code]");
    if (ta) {
      var saved = document.querySelector("[data-oa-saved]");
      var qid = ta.dataset.oaCode;
      var paint = function () { oaPaintEditor(); };

      ta.oninput = function () {
        paint();
        oaSaveDraft(OAV.attemptId, qid, ta.value, OAV.lang);
        if (saved) {
          saved.textContent = "saved";
          clearTimeout(ta._savedBell);
          ta._savedBell = setTimeout(function () { saved.textContent = ""; }, 1200);
        }
      };
      ta.onscroll = paint;

      /* Tab indents instead of leaving the editor. In a code box that is
         what the key means, and losing focus mid-problem to the next
         button is worse than losing the shortcut out. Escape then Tab
         still gets you out, which is the accessible way round. */
      ta.onkeydown = function (e) {
        if (e.key !== "Tab" || e.shiftKey || ta.readOnly) return;
        e.preventDefault();
        var s = ta.selectionStart;
        var t = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + "    " + ta.value.slice(t);
        ta.selectionStart = ta.selectionEnd = s + 4;
        ta.oninput();
      };

      paint();
    }

    if (OAV.view === "attempt" && OAV.mock && !OAV.expired) oaStartTimer();
    else oaStopTimer();
  }

  /* ---------------------------------------------------------- boot */

  function boot() {
    load();
    dsaLoad();
    dsaUiLoad();
    refreshBadges(stats());
    // A link straight to a section, e.g. /#dsa, opens on that section --
    // and #dsa/theory/<page>/<section> straight to a theory section.
    var wanted = (location.hash || "").replace("#", "");
    if (!dsaRoute(location.hash) && SECTIONS.some(function (s) { return s.id === wanted; })) {
      SECTION = wanted;
      ACTIVE = sectionTabs()[0].id;
    }
    window.addEventListener("popstate", function () { if (dsaRoute(location.hash)) render(); });
    document.getElementById("loading").classList.add("hide");
    document.getElementById("panel").classList.remove("hide");
    render();
    if (memOnly) toast("Progress will not persist in this browser.");

    // Both are server-backed and both are optional: opened from disk with no
    // API, the page still works off its cache and its baked data.
    syncFromServer().then(function () {
      refreshBadges(stats());
      render();
    });

    /* DSA progress is its own blob and its own round trip. It has to land
       before the rating is right -- solved problems are most of the ladder
       once the sheet fills up -- so the header repaints when it arrives. */
    if (DSA_PLAN) {
      dsaSyncFromServer().then(function () {
        refreshBadges(stats());
        render();
      });
      if (Object.keys(DSAV.timers).length) dsaStartTick();
      dsaLoadSchedule();
      setInterval(dsaLoadSchedule, 5 * 60 * 1000);
    }

    refreshOpportunities();

    refreshMbaCustom();
  }

  /* Items added and overrides applied later than the build -- through the
     manual editor on this page, or through an assistant's add_mba_item /
     add_mba_tags over MCP. The build baked data/mba.json into this page;
     this fetches whatever exists beyond that and rebuilds MBA from
     MBA_BASE plus the fetched delta, so a change made either way shows up
     here rather than only in an assistant's own answers. Same shape of
     fix as OPPS above.

     Called again after every edit made from this page, rather than
     patching MBA locally -- the server is the one place tag_add,
     tag_removed and exclude_over actually get reconciled (add undoing a
     stale remove and back), so re-fetching is the only way this view is
     guaranteed to agree with what a second tab, or an assistant, sees. */
  /* Postings, re-fetched after every edit rather than patched locally --
     the same reasoning as refreshMbaCustom below. Fail-soft: opened from
     disk with no API, the baked fallback stands. */
  function refreshOpportunities() {
    return fetch("/api/opportunities")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (r) {
        if (!Array.isArray(r.opportunities)) return;
        OPPS = r.opportunities;
        render();
      })
      .catch(function () { /* keep the baked fallback */ });
  }

  function refreshMbaCustom() {
    return fetch("/api/mba/custom")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (delta) {
        MBA = applyMbaDelta(delta);
        rebuildMbaItems();
        render();
      })
      .catch(function () { /* keep whatever MBA already held */ });
  }

  function cloneMbaBase() {
    return {
      phases: (MBA_BASE.phases || []).map(function (p) {
        return Object.assign({}, p, {
          items: (p.items || []).map(function (it) {
            return Object.assign({}, it, { tags: (it.tags || []).slice() });
          })
        });
      }),
      schools: MBA_BASE.schools || [],
      excluded: (MBA_BASE.excluded || []).map(function (it) {
        return Object.assign({}, it, { tags: (it.tags || []).slice() });
      })
    };
  }

  function applyMbaDelta(delta) {
    var next = cloneMbaBase();
    var added = (delta && delta.tag_add) || {};
    var removed = (delta && delta.tag_removed) || {};
    var over = (delta && delta.exclude_over) || {};
    var newItems = ((delta && delta.items) || []).map(function (it) {
      return Object.assign({ tags: [] }, it, { tags: (it.tags || []).slice(), source: "custom" });
    });

    /* Case-insensitive, the same way the server compares them, so "R1" on an
       item that already has "r1" is a no-op here too rather than a second
       pill saying the same thing. */
    function sameTag(a, b) {
      return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    }
    function resolveTags(it) {
      var extra = added[it.id];
      if (extra && extra.length) {
        extra.forEach(function (t) {
          var have = it.tags.some(function (x) { return sameTag(x, t); });
          if (!have) it.tags.push(t);
        });
      }
      var drop = removed[it.id];
      if (drop && drop.length) {
        it.tags = it.tags.filter(function (t) {
          return !drop.some(function (d) { return sameTag(d, t); });
        });
      }
    }
    function finalExcluded(it) {
      return Object.prototype.hasOwnProperty.call(over, it.id) ? over[it.id] : !!it.excluded;
    }

    next.phases.forEach(function (p) {
      p.items.forEach(function (it) { it.source = "curriculum"; resolveTags(it); });
    });
    next.excluded.forEach(function (it) { it.source = "curriculum"; resolveTags(it); });

    // Move anything an override forces the other way: out of its phase and
    // into EXCLUDED, or out of EXCLUDED into a holding section -- static
    // data has no phase to put a restored item back into, so it gets its
    // own section rather than a guessed one.
    var toHide = Object.keys(over).filter(function (id) { return over[id]; });
    var toShow = Object.keys(over).filter(function (id) { return !over[id]; });

    var pulledOut = [];
    next.phases.forEach(function (p) {
      p.items = p.items.filter(function (it) {
        if (toHide.indexOf(it.id) === -1) return true;
        pulledOut.push(it);
        return false;
      });
    });
    next.excluded = next.excluded.concat(pulledOut);

    var restored = [];
    next.excluded = next.excluded.filter(function (it) {
      if (toShow.indexOf(it.id) === -1) return true;
      restored.push(it);
      return false;
    });

    var liveCustom = newItems.filter(function (it) { return !finalExcluded(it); });
    var exclCustom = newItems.filter(finalExcluded);

    var extra = liveCustom.concat(restored);
    if (extra.length) {
      next.phases.push({ n: "CUSTOM", t: "Added or brought back", when: "No fixed cycle", items: extra });
    }
    next.excluded = next.excluded.concat(exclCustom);

    return next;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
