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
  /* Filled from the agent's live career feed at boot. The baked value is
     only a fallback for opening this file without a server -- the real
     source is gs://<bucket>/career/opportunities.json, which the agent
     appends to every time it spots an internship or placement mail. */
  var OPPS = (DATA.opportunities && DATA.opportunities.opportunities) || [];

  /* The DSA sheet. Two pieces are baked in by the build -- the spec (phases,
     tiers, stuck ladder, AI protocol, tag vocabulary) and a thin index of
     every problem, carrying what a row needs and nothing more.

     The rest -- learnings, theory, templates -- is ~2 MB at the full 600
     problems and is fetched per problem from /api/dsa/*. Baking it would
     make this page a multi-megabyte parse on a phone to show one day's
     fourteen rows. Opened from disk with no server the sheet still lists,
     filters and ticks; only the teaching material needs the API. */
  var DSA = DATA.dsa || null;
  var DSA_SPEC = (DSA && DSA.spec) || null;
  var DSA_INDEX = (DSA && DSA.index) || null;
  var DSA_PROBLEMS = (DSA_INDEX && DSA_INDEX.problems) || [];
  var DSA_BY_ID = {};
  DSA_PROBLEMS.forEach(function (p) { DSA_BY_ID[p.id] = p; });

  /* What a solved problem is worth against a ticked topic.

     Not 1:1, because they are not the same unit of work. A topic line is
     "Integer promotion & unsigned arithmetic" -- ten minutes of reading. A
     CORE problem is forty-five minutes with an empty file and no editorial.
     Weighting by tier uses a number the content already carries rather than
     one invented here, and it is what makes DSA roughly half the ladder
     instead of a quarter of it.

     To go back to flat 1:1, set all three to 1. Nothing else changes. */
  var DSA_WEIGHT = { CORE: 3, DRILL: 2, SKIM: 1 };

  /* The denominator is the SPEC pool, not the problems imported so far.

     Those differ -- three phases of six are in -- and using the imported
     count would mean the rating falls every time a phase lands, purely
     because the target moved. The pool is the real target and it is known
     from day one, so 600 it is, and an unimported phase simply reads as
     work not yet done. Which it is. */
  var DSA_POOL = (DSA_SPEC && DSA_SPEC.pool_size) || 0;

  /* Weighted size of the whole sheet, assuming the unimported remainder
     arrives at the tier mix SPEC plans for. Without this the ladder would
     shift under you as P2B and P3 land. */
  var DSA_TOTAL_WEIGHT = (function () {
    if (!DSA_SPEC) return 0;
    var known = 0;
    DSA_PROBLEMS.forEach(function (p) { known += DSA_WEIGHT[p.tier] || 1; });
    var mix = DSA_SPEC.tier_mix || { CORE: 0.4, DRILL: 0.35, SKIM: 0.25 };
    var perProblem = (mix.CORE || 0) * DSA_WEIGHT.CORE +
      (mix.DRILL || 0) * DSA_WEIGHT.DRILL + (mix.SKIM || 0) * DSA_WEIGHT.SKIM;
    return known + Math.max(0, DSA_POOL - DSA_PROBLEMS.length) * perProblem;
  })();

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

  var DSA_KEY = "launch-console-dsa-v1";
  var DSA_S = { problems: {} };
  var DSA_SYNC = { on: false, ts: 0 };

  var DSA_DEFAULTS = {
    status: "todo", revision: false, notes: "", tags: [],
    confidence: null, last_revised: null, goodnotes_ref: "", my_approach: ""
  };

  /* A problem's user fields, defaults filled in. Absent means untouched --
     the blob only ever holds rows that have been written to. */
  function dsaRow(id) {
    var stored = DSA_S.problems[id] || {};
    var out = {};
    for (var k in DSA_DEFAULTS) {
      out[k] = stored[k] === undefined ? DSA_DEFAULTS[k] : stored[k];
    }
    out.tags = (out.tags || []).slice();
    return out;
  }

  function dsaLoad() {
    try {
      var raw = localStorage.getItem(DSA_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p.problems === "object") DSA_S = { problems: p.problems || {} };
      }
    } catch (e) { /* cache only; the server is the record */ }
  }

  function dsaCache() {
    try { localStorage.setItem(DSA_KEY, JSON.stringify(DSA_S)); } catch (e) { /* full or blocked */ }
  }

  /* Write one problem's fields. Optimistic: the row updates locally and the
     UI repaints at once, and the PATCH reconciles afterwards. A failure
     says so rather than silently reverting -- losing a paragraph of notes
     to a dropped connection with no warning is the bad outcome here. */
  function dsaPatch(id, patch) {
    var row = DSA_S.problems[id] || (DSA_S.problems[id] = {});
    for (var k in patch) row[k] = patch[k];

    // Stamping the revision date on a status change mirrors what the server
    // does, so an offline tick and an online one agree.
    if (patch.status && patch.status !== "todo" && patch.last_revised === undefined) {
      row.last_revised = today();
    }
    dsaCache();

    if (!DSA_SYNC.on) return Promise.resolve(row);

    return fetch("/api/dsa/progress/" + encodeURIComponent(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (b) { throw new Error(b.error || r.status); });
        return r.json();
      })
      .then(function (res) {
        // The server is authoritative about the resulting row -- it applies
        // the same defaults collapse, so a row back at every default comes
        // back empty and should disappear here too.
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

  function dsaSyncFromServer() {
    return fetch("/api/dsa/progress")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (res) {
        DSA_SYNC.on = true;
        DSA_SYNC.ts = res.updated_ts || 0;
        if (res.updated_ts && res.problems) {
          DSA_S = { problems: res.problems };
          dsaCache();
          return true;
        }
        // Nothing server-side yet. Push this browser's rows one at a time so
        // an existing local history becomes the shared starting point.
        var ids = Object.keys(DSA_S.problems);
        ids.forEach(function (id) {
          if (DSA_BY_ID[id]) dsaPatch(id, DSA_S.problems[id]);
        });
        return false;
      })
      .catch(function () { DSA_SYNC.on = false; return false; });
  }

  /* ---------------------------------------------------------- helpers */

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
  function dsaScore() {
    var earned = 0;
    var solved = 0;
    for (var id in DSA_S.problems) {
      var p = DSA_BY_ID[id];
      if (!p) continue;                       // a problem removed by a re-import
      if ((DSA_S.problems[id] || {}).status !== "solved") continue;
      earned += DSA_WEIGHT[p.tier] || 1;
      solved++;
    }
    return { earned: earned, solved: solved, weight: DSA_TOTAL_WEIGHT, pool: DSA_POOL };
  }

  function stats() {
    var topicsDone = RATED.filter(function (x) { return S.checked[x.id]; }).length;
    var dsa = dsaScore();

    /* One ladder, two contributions. A ticked topic is one unit; a solved
       problem is one to three depending on tier. At the full sheet DSA is
       just under half the climb, which is the weight the sheet earns. */
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
      var needCore = Math.ceil(gap / (perUnit * DSA_WEIGHT.CORE));
      noteEl.innerHTML = needTopics + " topics <i>or</i> " + needCore +
        " CORE problems to <b>" + esc(next.n) + "</b>";
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
    var clearedN = st.topicsDone + st.dsa.solved;
    var clearedOf = st.topicsTotal + st.dsa.pool;
    document.getElementById("cleared").textContent = clearedN;
    document.getElementById("clearedSub").textContent = DSA_POOL
      ? st.topicsDone + " topics · " + st.dsa.solved + " problems"
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

  function askHandle() {
    var current = (AGENT.settings && AGENT.settings.cf_handle) ||
      (CF.data && CF.data.handle) || "";
    var handle = window.prompt("Your Codeforces handle", current);
    if (handle === null) return;
    handle = handle.trim();
    api("/api/settings", { method: "PUT", body: JSON.stringify({ cf_handle: handle }) })
      .then(function (r) {
        if (handle && !r.cf_handle) {
          toast("That does not look like a Codeforces handle.");
          return;
        }
        if (AGENT.settings) AGENT.settings.cf_handle = r.cf_handle;
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
  var SECTIONS = [
    { id: "placement", label: "Placement" },
    { id: "mba", label: "MBA" },
    { id: "agent", label: "Email Agent" }
  ];

  var TABS = [{ id: "overview", label: "Overview", domain: "placement", section: "placement" }];
  PL.tracks.forEach(function (t) {
    TABS.push({ id: t.id, label: t.label, domain: "placement", section: "placement", track: t });
  });
  TABS.push({ id: "career", label: "Opportunities", domain: "placement", section: "placement" });
  TABS.push({ id: "mba", label: "MBA Windows", domain: "mba", section: "mba" });
  TABS.push({ id: "agent", label: "Agent", domain: "agent", section: "agent" });

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

  function renderCareer() {
    if (!OPPS.length) {
      return '<div class="empty">No opportunities yet.<br><br>' +
        "This tab is fed by the inbox agent: every internship and placement mail it sees " +
        "is extracted into <span class=\"mono\">data/opportunities.json</span> and appears here. " +
        "Deploy the agent, or drop a feed file in place, and this fills itself.</div>";
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
        (o.deadline && !closed
          ? ' <button class="btn tiny" data-oppcal="' + esc(o.id) + '">Add deadline to calendar</button>'
          : "") +
        (o.source && o.source.gmail_url
          ? ' <a class="tag" href="' + esc(o.source.gmail_url) + '" target="_blank" rel="noopener noreferrer">Mail</a>'
          : "") +
        "</div></div>";
    }).join("");
  }

  /* ---------------------------------------------------------- agent */

  /* The Agent tab is the only part of this page backed by a server. When the
     file is opened straight from disk there is no API to talk to, so it says
     so rather than showing controls that silently do nothing. */

  var AGENT = { loading: false, loaded: false, error: "", locked: false, status: null, settings: null };

  function ago(ts) {
    if (!ts) return "never";
    var s = Date.now() / 1000 - Number(ts);
    if (s < 90) return "just now";
    if (s < 5400) return Math.round(s / 60) + " min ago";
    if (s < 172800) return Math.round(s / 3600) + " h ago";
    return Math.round(s / 86400) + " d ago";
  }

  function api(path, opts) {
    var o = opts || {};
    o.headers = Object.assign({ "Content-Type": "application/json" }, o.headers || {});
    if (AGENT.password) o.headers["X-Console-Password"] = AGENT.password;
    return fetch(path, o).then(function (r) {
      if (r.status === 401) { AGENT.locked = true; throw new Error("locked"); }
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          throw new Error(String(j.error || r.status).slice(0, 240));
        });
      }
      return r.json();
    });
  }

  function loadAgent() {
    if (AGENT.loading) return;
    AGENT.loading = true;
    Promise.all([
      api("/api/status"),
      api("/api/settings"),
      // Optional extras: an older console will not have these, and the tab
      // should degrade rather than refuse to render.
      api("/api/proposals").catch(function () { return { batches: [], recent: [] }; }),
      api("/api/reports").catch(function () { return { reports: [], runs: [] }; })
    ])
      .then(function (r) {
        AGENT.status = r[0]; AGENT.settings = r[1];
        AGENT.proposals = r[2]; AGENT.reports = r[3];
        AGENT.loaded = true; AGENT.error = "";
      })
      .catch(function (e) { AGENT.error = e.message || String(e); })
      .then(function () { AGENT.loading = false; repaintAgent(); });
  }

  function repaintAgent() {
    if (ACTIVE !== "agent") return;
    document.getElementById("panel").innerHTML = renderAgent();
    bindAgent();
  }

  function renderAgent() {
    if (AGENT.locked) {
      return '<div class="card agent-gate"><h3>This console is password protected</h3>' +
        '<input type="password" id="agPass" placeholder="Password" autocomplete="current-password">' +
        '<button class="btn primary" id="agUnlock">Unlock</button></div>';
    }
    if (!AGENT.loaded) {
      if (AGENT.error) {
        return '<div class="card agent-off"><h3>Agent controls unavailable</h3>' +
          "<p>Could not reach the console API. This tab only works on the deployed " +
          "site, not on a copy opened from disk.</p>" +
          '<p class="mono err">' + esc(AGENT.error) + "</p>" +
          '<button class="btn" id="agRetry">Try again</button></div>';
      }
      return '<div class="card"><p class="muted">Loading agent…</p></div>';
    }

    var s = AGENT.status, cfg = AGENT.settings;
    var live = cfg.dry_run === false;
    var cleanupLive = cfg.cleanup_dry_run === false;
    var stopped = cfg.paused === true;
    /* Tristate: null means "no opinion, whatever config.yaml says", which is
       on. Only an explicit false is off. */
    var starring = cfg.star_enabled !== false;

    var cards = [
      ["Last summary", ago(s.last_digest_ts)],
      ["Last urgent ping", ago(s.last_alert_ts)],
      ["Last junk sweep", ago(s.last_cleanup_ts)],
      ["Calendar items to confirm", s.open_proposals + (s.open_proposals === 1 ? " item" : " items")],
      ["Added to calendar", String(s.events_created)],
      ["Junk binned so far", String(s.trashed_total)]
    ].map(function (c) {
      return '<div class="stat"><div class="k">' + esc(c[0]) + '</div><div class="v">' + esc(c[1]) + "</div></div>";
    }).join("");

    var accounts = s.accounts.map(function (a) {
      return '<li><span class="mono">' + esc(a.email) + "</span>" +
        '<span class="pill' + (a.can_send ? " send" : "") + '">' + esc(a.role) + "</span>" +
        (a.removable
          ? '<button class="btn tiny danger" data-remove="' + esc(a.key) + '">Disconnect</button>'
          : '<span class="muted tiny">fixed at deploy</span>') + "</li>";
    }).join("");

    return "" +
      '<div class="strip agent-strip">' + cards + "</div>" +

      '<div class="card">' +
        "<h3>Tell it what matters</h3>" +
        /* An unreadable settings file and an empty one look identical here,
           and mean opposite things -- the second is honest, the first shows
           you switches that are not what the agent is using. */
        (cfg.read_error
          ? '<p class="err">Your saved settings could not be read, so this box ' +
            "is showing defaults rather than what is stored — and saving is " +
            "blocked until it is fixed, because it would overwrite them. " +
            '<span class="mono">' + esc(cfg.read_error) + "</span></p>"
          : "") +
        '<p class="muted">Write here like you are briefing a person. It reads this ' +
        "before going through your mail, every single time.</p>" +
        '<textarea id="agInstr" rows="14" maxlength="' + (cfg.max_instructions || 8000) + '" ' +
        'placeholder="Examples:&#10;&#10;Anything from Prof. Sharma or the CDC office is always important.&#10;' +
        'Placement and internship mail outranks everything else this semester.&#10;' +
        'Treat coding-contest invitations as opportunities, not newsletters.&#10;' +
        'I am tracking deferred MBA programmes — flag anything mentioning ISB YLP or Harvard 2+2.&#10;' +
        'Newsletters from Unstop and Naukri are noise unless they name a real deadline.">' +
        esc(cfg.instructions || "") + "</textarea>" +
        '<div class="agent-actions">' +
          '<button class="btn primary" id="agSave">Save instructions</button>' +
          '<span class="muted" id="agSaved">Last saved ' + ago(cfg.updated_ts) + "</span>" +
          '<span class="muted count" id="agCount"></span>' +
        "</div>" +
        rulesBlock(cfg) +
        '<p class="muted fineprint">This changes its <b>judgement</b> — what it treats ' +
        "as important, ignorable, or worth flagging — and what it stars, protects and " +
        "bins, via the rules above. Everything it does is <b>additive</b>: no wording " +
        "here can remove a protection, shorten a list, or drop a section from your " +
        "summary. How much may be binned in one run, the 30-day minimum age, and the " +
        "fact that nothing is ever deleted permanently are fixed in code and cannot be " +
        "reached from this page.</p>" +
      "</div>" +

      '<div class="card">' +
        "<h3>Switches</h3>" +
        /* The stop button, first, because it is the one you want when
           something is going wrong and you do not yet know what. */
        '<div class="switch-row' + (stopped ? " stopped" : "") + '">' +
          '<label class="switch"><input type="checkbox" id="agStop"' + (stopped ? " checked" : "") + ">" +
          "<span>Stop the agent</span></label>" +
          '<span class="muted">' + (stopped
            ? "<b>Stopped.</b> It is not reading your mail at all — no summaries, " +
              "no urgent pings, no starring, no binning. The scheduled runs still " +
              "start every 15 minutes, see this switch, and exit in about a second. " +
              "Nothing is lost; turn it back on and it picks up where it left off."
            : "<b>Running.</b> Turn this on to halt everything at once — it stops " +
              "before opening a mailbox. Use this rather than the two switches " +
              "below if you want it to do nothing at all.") + "</span>" +
        "</div>" +
        '<div class="switch-row">' +
          '<label class="switch"><input type="checkbox" id="agLive"' + (live ? " checked" : "") + ">" +
          "<span>Let it act</span></label>" +
          '<span class="muted">' + (live
            ? "<b>On.</b> It stars mail and emails you for real."
            : "<b>Off.</b> It reads and works everything out, but changes nothing " +
              "and sends nothing. Practice mode.") + "</span>" +
        "</div>" +
        '<div class="switch-row">' +
          '<label class="switch"><input type="checkbox" id="agStar"' + (starring ? " checked" : "") + ">" +
          "<span>Let it star mail</span></label>" +
          '<span class="muted">' + (starring
            ? "<b>On.</b> It stars anything matching its rules and labels it " +
              "<span class=\"mono\">Agent/Flagged</span>. Those rules are broad — " +
              "whole categories, not a handful of senders — so this is the noisiest " +
              "thing it does. Turn it off and everything else carries on unchanged."
            : "<b>Off.</b> It stars nothing. Summaries, urgent pings, the calendar " +
              "loop and the cleanup all still run. Stars it has already put on are " +
              "left alone; unstar them yourself and it will not put them back.") + "</span>" +
        "</div>" +
        '<div class="switch-row">' +
          '<label class="switch"><input type="checkbox" id="agCleanup"' + (cleanupLive ? " checked" : "") + ">" +
          "<span>Let it bin junk</span></label>" +
          '<span class="muted">' + (cleanupLive
            ? "<b>On.</b> Old newsletters and promos go to Trash, where Gmail " +
              "keeps them for 30 days. Nothing is ever deleted for good."
            : "<b>Off.</b> It lists what it would bin so you can check its taste " +
              "first. Bins nothing.") + "</span>" +
        "</div>" +
      "</div>" +

      '<div class="card">' +
        "<h3>Run something now</h3>" +
        "<p class=\"muted\">It does all of this on a schedule anyway — these are " +
        "for when you don't want to wait.</p>" +
        '<div class="run-list">' +
          '<div class="run-item"><button class="btn primary" data-run="digest">Email me a summary</button>' +
          '<span class="muted">The last 3 days of mail: what needs you, what has a ' +
          'deadline, any new opportunities. Happens automatically at 7am, noon, 5pm ' +
          'and 9pm. Takes 3–5 minutes.</span></div>' +

          '<div class="run-item"><button class="btn primary" data-run="review">Full inbox review</button>' +
          '<span class="muted">Reads your <b>whole inbox</b> — old and new, opened and ' +
          'unopened — and emails one master summary of everything still hanging over ' +
          'you. Never stars or bins anything. Takes 10–20 minutes.</span></div>' +

          '<div class="run-item"><button class="btn" data-run="sweep">Check for anything urgent</button>' +
          '<span class="muted">Glances at the last few hours and emails you only if ' +
          'something genuinely cannot wait. Runs by itself every 15 minutes, so this ' +
          'is rarely needed. Usually silent.</span></div>' +

          '<div class="run-item"><button class="btn" data-run="cleanup">Show me what it would bin</button>' +
          '<span class="muted">Lists the junk it thinks could go, without touching ' +
          'it. Use this a few times before turning on "let it bin junk".</span></div>' +
        "</div>" +
        '<div class="agent-actions"><span class="muted" id="agRun"></span></div>' +
      "</div>" +

      calendarCard() +
      reportsCard() +
      versionCard(s) +

      '<div class="card">' +
        "<h3>Mailboxes it reads</h3>" +
        '<p class="muted">All of these are combined into the single summary sent to ' +
        '<span class="mono">' + esc(s.report_to) + "</span>.</p>" +
        '<ul class="accounts">' + accounts + "</ul>" +
        (s.oauth_ready
          ? '<a class="btn primary" href="/api/accounts/connect">Connect another mailbox</a>'
          : '<p class="muted">Adding more mailboxes needs a one-off web OAuth client ' +
            "(see <span class=\"mono\">console/README.md</span>). The mailboxes above " +
            "work regardless — this is the only thing that setup unlocks.</p>") +
        '<p class="muted fineprint">Mailboxes you add can be read and tidied, but can never send email. Only your main address sends.</p>' +
      "</div>";
  }

  /* Calendar items the agent proposed. Previously these could only be
     confirmed by replying to the digest email; the same batches are shown
     here so you can decide wherever you happen to be. Confirming queues the
     work for the agent -- this page cannot create events itself, because
     that needs the calendar credentials that deliberately stay with the
     job rather than with a service open to the internet. */
  function calendarCard() {
    var p = AGENT.proposals || {};
    var batches = p.batches || [];
    var queued = p.queued || [];

    var body = batches.map(function (b) {
      var rows = b.items.map(function (i) {
        var meta = '<span class="rdate">' + esc(i.start) + (i.all_day ? "" : " (timed)") + "</span>";
        if (i.source_url) {
          meta += ' <a class="rlink" href="' + esc(i.source_url) +
            '" target="_blank" rel="noopener">the email</a>';
        }
        return '<li><label class="switch"><input type="checkbox" data-prop="' +
          esc(b.token) + '" value="' + i.n + '"><span></span></label>' +
          '<div class="rbody"><div class="rtask">' + esc(i.title) + "</div>" +
          (i.context ? '<div class="rnote">' + esc(i.context) + "</div>" : "") +
          '<div class="rmeta">' + meta + "</div></div></li>";
      }).join("");
      return '<div class="prop-batch"><ul class="accounts prop-list">' + rows + "</ul>" +
        '<div class="agent-actions">' +
        '<button class="btn primary" data-propgo="' + esc(b.token) + '">Add ticked to calendar</button>' +
        '<button class="btn" data-propnone="' + esc(b.token) + '">Dismiss all</button>' +
        "</div></div>";
    }).join("");

    var pending = queued.length
      ? '<p class="muted fineprint">' + queued.length +
        " queued — the agent adds these on its next run, within 15 minutes.</p>"
      : "";

    var intro = batches.length
      ? '<p class="muted">Nothing below is on your calendar yet.</p>'
      : '<p class="muted">Nothing waiting. When the agent spots a date in your ' +
        "mail, the proposal appears here and in your digest.</p>";

    /* The agent misses things -- a date buried in a paragraph, a mail that
       arrived before it was watching, a proposal you dismissed and then
       changed your mind about. Without this the only way onto the calendar
       was to wait for it to offer, so a date you could see in front of you
       was one you could not act on. Goes through the same queue as a
       confirmed proposal: the page still cannot write to a calendar. */
    var manual = '<div class="prop-manual">' +
      '<div class="rtask">Add one yourself</div>' +
      '<p class="muted fineprint">For anything it missed — a date buried in a ' +
      "paragraph, or mail that arrived before it was watching. The agent puts it " +
      'on the "Inbox Agent" calendar on its next run, within 15 minutes.</p>' +
      '<div class="edit-body">' +
        '<input id="calTitle" type="text" maxlength="200" ' +
          'placeholder="What is it? e.g. Meesho DICE challenge closes">' +
        '<div class="edit-row">' +
          '<input id="calDate" type="date">' +
          '<button type="button" class="btn primary tiny" id="calAdd">Add to calendar</button>' +
        "</div>" +
      "</div></div>";

    return '<div class="card"><h3>Calendar — waiting on you</h3>' +
      intro + body + pending + manual + "</div>";
  }

  /* Every report the agent sends is archived, so "did my full inbox review
     work?" is answerable here rather than only from the cloud logs -- and a
     run that failed before sending still shows up, which is exactly the case
     that is otherwise invisible. */
  function reportsCard() {
    var r = AGENT.reports || {};
    var reports = r.reports || [];
    var runs = r.runs || [];

    var failed = runs.filter(function (x) { return !x.ok; }).slice(0, 3);
    var failedHtml = failed.length
      ? '<div class="run-fail">' + failed.map(function (x) {
          return "<div><b>" + esc(x.mode) + "</b> failed " + ago(x.finished_ts) +
            (x.detail ? " — " + esc(x.detail) : "") + "</div>";
        }).join("") + "</div>"
      : "";

    if (!reports.length) {
      return '<div class="card"><h3>Sent reports</h3>' + failedHtml +
        '<p class="muted">Nothing archived yet. Reports appear here from the ' +
        "next run onwards.</p></div>";
    }

    var list = reports.map(function (x) {
      return '<li><button class="linkish" data-report="' + esc(x.id) + '">' +
        esc(x.subject || x.mode) + "</button>" +
        '<span class="pill">' + esc(x.mode) + "</span>" +
        '<span class="muted tiny">' + ago(x.ts) + (x.sent ? "" : " · not sent") + "</span></li>";
    }).join("");

    return '<div class="card"><h3>Sent reports</h3>' + failedHtml +
      '<ul class="accounts reports">' + list + "</ul>" +
      '<div id="reportView"></div></div>';
  }

  /* The website and the agent are two separate deployments made from one
     build. A build that fails halfway updates the page and leaves the agent
     on older code -- which looks exactly like a fix that did not work, and
     costs a day of chasing the wrong thing. So both versions are on screen. */
  function versionCard(s) {
    if (!s.console_version && !s.agent_version) return "";
    var mismatch = s.console_version && s.agent_version && !s.versions_match;
    return '<div class="card' + (mismatch ? " warn" : "") + '">' +
      "<h3>Deployed version</h3>" +
      (mismatch
        ? '<p class="err">These do not match. The last deploy only finished ' +
          "half way, so the agent is still running older code — anything you " +
          "changed recently is not live yet. Re-run <span class=\"mono\">" +
          "./deploy-all.sh</span>.</p>"
        : "") +
      '<ul class="accounts"><li><span>This website</span>' +
      '<span class="mono">' + esc(s.console_version || "unknown") + "</span></li>" +
      "<li><span>Email agent</span>" +
      '<span class="mono">' + esc(s.agent_version || "not reported yet") + "</span></li></ul>" +
      (s.agent_version ? "" : '<p class="muted fineprint">The agent reports its ' +
        "version on its next run, within 15 minutes of a deploy.</p>") +
      "</div>";
  }

  /* What your prose compiled to. Shown because a rule that changes what gets
     binned should be visible as a rule, not inferred from a paragraph. */
  function rulesBlock(cfg) {
    if (cfg.compile_pending) {
      return '<div class="rules pending">Working out the rules from what you ' +
        "wrote — they appear here after the next run, within 15 minutes.</div>";
    }
    var lines = cfg.rules || [];
    if (!lines.length) {
      return cfg.instructions
        ? '<div class="rules">No concrete rules came out of this yet — it still ' +
          "guides how mail is judged.</div>"
        : "";
    }
    return '<div class="rules"><div class="rules-hd">Rules in force</div>' +
      "<ul>" + lines.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>" +
      (cfg.rules_note ? '<div class="rules-note">' + esc(cfg.rules_note) + "</div>" : "") +
      "</div>";
  }

  function bindAgent() {
    if (AGENT.locked) {
      var unlock = document.getElementById("agUnlock");
      if (unlock) unlock.onclick = function () {
        AGENT.password = document.getElementById("agPass").value;
        AGENT.locked = false; AGENT.loaded = false;
        repaintAgent(); loadAgent();
      };
      return;
    }
    if (!AGENT.loaded) {
      var retry = document.getElementById("agRetry");
      if (retry) retry.onclick = function () { AGENT.error = ""; repaintAgent(); loadAgent(); };
      if (!AGENT.error) loadAgent();
      return;
    }

    var box = document.getElementById("agInstr");
    var count = document.getElementById("agCount");
    function updateCount() {
      if (count && box) count.textContent = box.value.length + " / " + (AGENT.settings.max_instructions || 8000);
    }
    if (box) { box.oninput = updateCount; updateCount(); }

    var save = document.getElementById("agSave");
    if (save) save.onclick = function () {
      save.disabled = true;
      api("/api/settings", { method: "PUT", body: JSON.stringify({ instructions: box.value }) })
        .then(function (r) {
          AGENT.settings = Object.assign(AGENT.settings, r);
          document.getElementById("agSaved").textContent = "Last saved just now";
          toast("Saved. The rules are worked out on the next run.");
          repaintAgent();
        })
        .catch(function (e) { toast("Could not save: " + e.message); })
        .then(function () { save.disabled = false; });
    };

    function toggle(id, field, label) {
      var el = document.getElementById(id);
      if (!el) return;
      el.onchange = function () {
        var body = {}; body[field] = !el.checked;   // checkbox is "act", field is "dry run"
        api("/api/settings", { method: "PUT", body: JSON.stringify(body) })
          .then(function (r) {
            AGENT.settings = Object.assign(AGENT.settings, r);
            toast(label + (el.checked ? " is live." : " is in dry run."));
            repaintAgent();
          })
          .catch(function (e) { el.checked = !el.checked; toast("Could not change: " + e.message); });
      };
    }
    toggle("agLive", "dry_run", "Acting on mail");
    toggle("agCleanup", "cleanup_dry_run", "Cleanup");

    /* Not a dry-run switch either: ticked means "do star", so the value goes
       through as-is. Sent as a real boolean rather than left null, because
       null means "defer to the deployed config" and the point of touching
       this switch is to stop deferring. */
    var star = document.getElementById("agStar");
    if (star) star.onchange = function () {
      var want = star.checked;
      api("/api/settings", { method: "PUT", body: JSON.stringify({ star_enabled: want }) })
        .then(function (r) {
          AGENT.settings = Object.assign(AGENT.settings, r);
          toast(want ? "Starring is on." : "Starring is off.");
          repaintAgent();
        })
        .catch(function (e) { star.checked = !want; toast("Could not change: " + e.message); });
    };

    /* Not a dry-run switch: ticked means stopped, so the value goes through
       as-is rather than inverted. */
    var stop = document.getElementById("agStop");
    if (stop) stop.onchange = function () {
      var want = stop.checked;
      api("/api/settings", { method: "PUT", body: JSON.stringify({ paused: want }) })
        .then(function (r) {
          AGENT.settings = Object.assign(AGENT.settings, r);
          toast(want ? "Stopped. It will not read your mail." : "Running again.");
          repaintAgent();
        })
        .catch(function (e) { stop.checked = !want; toast("Could not change: " + e.message); });
    };

    document.querySelectorAll("[data-run]").forEach(function (b) {
      b.onclick = function () {
        var note = document.getElementById("agRun");
        var slow = b.dataset.run === "review";
        b.disabled = true; if (note) note.textContent = "starting…";
        api("/api/run", { method: "POST", body: JSON.stringify({ mode: b.dataset.run }) })
          .then(function () {
            if (!note) return;
            note.textContent = slow
              ? "started — it is reading your whole inbox, so give it 10–20 minutes"
              : "started — check your inbox in a few minutes";
          })
          .catch(function (e) { if (note) note.textContent = "failed: " + e.message; })
          .then(function () { b.disabled = false; });
      };
    });

    var calAdd = document.getElementById("calAdd");
    if (calAdd) calAdd.onclick = function () {
      var title = (document.getElementById("calTitle").value || "").trim();
      var when = document.getElementById("calDate").value || "";
      if (!title) { toast("Give it a title first."); return; }
      if (!when) { toast("Pick a date first."); return; }
      calAdd.disabled = true;
      api("/api/calendar/request", {
        method: "POST",
        body: JSON.stringify({ title: title, start: when, origin: "manual" })
      })
        .then(function () {
          toast("Queued — on your calendar within 15 minutes.");
          document.getElementById("calTitle").value = "";
          AGENT.loaded = false; repaintAgent(); loadAgent();
        })
        .catch(function (e) { toast("Could not queue it: " + e.message); calAdd.disabled = false; });
    };

    // --- calendar proposals ------------------------------------------
    function decide(token, numbers, label) {
      api("/api/proposals/decide", {
        method: "POST",
        body: JSON.stringify({ token: token, track: numbers })
      })
        .then(function (r) {
          toast(r.queued
            ? r.queued + " queued — on your calendar within 15 minutes."
            : label);
          AGENT.loaded = false; repaintAgent(); loadAgent();
        })
        .catch(function (e) { toast("Could not save that: " + e.message); });
    }

    document.querySelectorAll("[data-propgo]").forEach(function (b) {
      b.onclick = function () {
        var token = b.dataset.propgo;
        var picked = [];
        document.querySelectorAll('[data-prop="' + token + '"]').forEach(function (cb) {
          if (cb.checked) picked.push(Number(cb.value));
        });
        if (!picked.length) { toast("Tick the ones you want first."); return; }
        b.disabled = true;
        decide(token, picked, "");
      };
    });

    document.querySelectorAll("[data-propnone]").forEach(function (b) {
      b.onclick = function () {
        b.disabled = true;
        decide(b.dataset.propnone, [], "Dismissed. Nothing was scheduled.");
      };
    });

    // --- archived reports ----------------------------------------------
    document.querySelectorAll("[data-report]").forEach(function (b) {
      b.onclick = function () {
        var host = document.getElementById("reportView");
        if (!host) return;
        if (host.dataset.showing === b.dataset.report) {
          host.innerHTML = ""; host.dataset.showing = ""; return;
        }
        host.dataset.showing = b.dataset.report;
        // An iframe, not innerHTML: the body is built from email content, so
        // it stays in its own document rather than joining this one.
        host.innerHTML = '<iframe class="report-frame" sandbox="" src="/api/reports/' +
          encodeURIComponent(b.dataset.report) + '"></iframe>';
      };
    });

    document.querySelectorAll("[data-remove]").forEach(function (b) {
      b.onclick = function () {
        if (!confirm("Stop reading " + b.dataset.remove + "?")) return;
        api("/api/accounts/remove", { method: "POST", body: JSON.stringify({ key: b.dataset.remove }) })
          .then(function () { AGENT.loaded = false; repaintAgent(); loadAgent(); })
          .catch(function (e) { toast("Could not disconnect: " + e.message); });
      };
    });
  }

  /* ---------------------------------------------------------- render */

  var CF_TIMERS = false;

  function render() {
    var mine = sectionTabs();
    var tab = mine.find(function (t) { return t.id === ACTIVE; }) || mine[0];
    ACTIVE = tab.id;
    document.body.classList.toggle("domain-mba", tab.domain === "mba");
    document.body.classList.toggle("domain-agent", tab.domain === "agent");

    var panel = document.getElementById("panel");
    if (tab.id === "overview") panel.innerHTML = renderOverview();
    else if (tab.id === "mba") panel.innerHTML = renderMba();
    else if (tab.id === "career") panel.innerHTML = renderCareer();
    else if (tab.id === "agent") panel.innerHTML = renderAgent();
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
    if (tab.id === "agent") bindAgent();
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

    document.querySelectorAll("[data-oppcal]").forEach(function (b) {
      b.onclick = function () {
        var o = OPPS.find(function (x) { return x.id === b.dataset.oppcal; });
        if (!o) return;
        b.disabled = true;
        fetch("/api/calendar/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: (o.company ? o.company + " — " : "") + (o.role || "Application deadline"),
            start: o.deadline,
            source_url: o.apply_url || "",
            origin: "opportunity"
          })
        })
          .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (res.ok) { toast("Queued — on your calendar within 15 minutes."); b.textContent = "Queued"; }
            else if (res.j && /already queued/.test(res.j.error || "")) { toast("Already queued."); b.textContent = "Queued"; }
            else { toast("Could not queue: " + ((res.j && res.j.error) || "unknown")); b.disabled = false; }
          })
          .catch(function () { toast("Could not reach the server."); b.disabled = false; });
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

  /* ---------------------------------------------------------- boot */

  function boot() {
    load();
    refreshBadges(stats());
    // The OAuth round trip comes back to /#agent, so honour the hash.
    var wanted = (location.hash || "").replace("#", "");
    if (SECTIONS.some(function (s) { return s.id === wanted; })) {
      SECTION = wanted;
      ACTIVE = sectionTabs()[0].id;
    }
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

    fetch("/api/opportunities")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (r) {
        if (!Array.isArray(r.opportunities)) return;
        OPPS = r.opportunities;
        render();
      })
      .catch(function () { /* keep the baked fallback */ });

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
