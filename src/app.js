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
  var MBA = DATA.mba || { phases: [], schools: [], excluded: [] };
  var OPPS = (DATA.opportunities && DATA.opportunities.opportunities) || [];

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

  var S = { checked: {}, mba: {}, days: [], badges: [], open: {}, opps: {} };
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
          opps: p.opps || {}
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

  function save() {
    if (memOnly) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(S));
      } catch (e) {
        memOnly = true;
        toast("Could not save progress. Storage may be full or blocked.");
      }
    }, 300);
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
     apply" never quietly becomes "I forgot to apply". */
  var MBA_ITEMS = [];
  MBA.phases.forEach(function (p) {
    (p.items || []).forEach(function (it) {
      MBA_ITEMS.push({ item: it, phase: p.n, phaseTitle: p.t, excluded: false });
    });
  });
  (MBA.excluded || []).forEach(function (it) {
    MBA_ITEMS.push({ item: it, phase: "EXCLUDED", phaseTitle: "Decided against", excluded: true });
  });

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

  function stats() {
    var done = RATED.filter(function (x) { return S.checked[x.id]; }).length;
    var total = RATED.length;
    var pct = total ? (done / total) * 100 : 0;
    var st = {
      done: done, total: total, pct: pct,
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

  function refreshBadges(st) {
    var gained = [];
    PL.badges.forEach(function (b) {
      var rule = BADGE_RULES[b.id];
      if (!rule) return;
      var has = S.badges.indexOf(b.id) !== -1;
      if (!has && rule(st)) { S.badges.push(b.id); gained.push(b); }
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
      var perTopic = 2400 / RATED.length;
      var need = Math.ceil((next.min - st.rating) / perTopic);
      noteEl.innerHTML = need + " more topics to <b>" + esc(next.n) + "</b>";
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
    document.getElementById("cleared").textContent = st.done;
    document.getElementById("clearedSub").textContent = "of " + st.total;
    document.getElementById("streak").textContent = st.streak;
    document.getElementById("badgeCount").textContent = S.badges.length;
    document.getElementById("badgeSub").textContent = "of " + PL.badges.length + " unlocked";
  }

  function hexSoft(hex) {
    var h = hex.replace("#", "");
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + ",.14)";
  }

  /* ---------------------------------------------------------- tabs */

  var TABS = [{ id: "overview", label: "Overview", domain: "placement" }];
  PL.tracks.forEach(function (t) {
    TABS.push({ id: t.id, label: t.label, domain: "placement", track: t });
  });
  TABS.push({ id: "mba", label: "MBA Windows", domain: "mba" });
  TABS.push({ id: "career", label: "Opportunities", domain: "placement" });

  var ACTIVE = "overview";
  var QUERY = "";

  function renderTabs() {
    var st = stats();
    document.getElementById("tabs").innerHTML = TABS.map(function (t) {
      var pc = "";
      if (t.track) {
        pc = ' <span class="pc">' + Math.round(st.trackPct(t.track.id)) + "%</span>";
      } else if (t.id === "mba") {
        var ws = windowStats();
        pc = ' <span class="pc">' + Math.round(ws.pct) + "%</span>";
      } else if (t.id === "career") {
        pc = OPPS.length ? ' <span class="pc">' + OPPS.length + "</span>" : "";
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
    var html = '<div class="toolbar">' +
      '<input class="search" id="search" placeholder="Filter topics in ' + esc(track.label) +
      '…" value="' + esc(QUERY) + '">' +
      '<button class="btn" data-all="1">Expand all</button>' +
      '<button class="btn" data-all="0">Collapse all</button></div>';

    track.sections.forEach(function (sec) {
      var groups = sec.g.map(function (g) {
        var items = g.i.map(function (label) {
          return INDEX.find(function (x) {
            return x.track === track.id && x.sec === sec.n && x.label === label;
          });
        }).filter(function (x) {
          return x && (!q || x.label.toLowerCase().indexOf(q) !== -1);
        });
        if (!items.length) return "";
        return '<div class="grp-name">' + esc(g.n) + "</div>" +
          '<div class="items">' + items.map(itemRow).join("") + "</div>";
      }).join("");

      if (q && !groups) return;

      var all = INDEX.filter(function (x) { return x.track === track.id && x.sec === sec.n; });
      var done = all.filter(function (x) { return S.checked[x.id]; }).length;
      var pct = all.length ? (done / all.length) * 100 : 0;
      var key = track.id + "|" + sec.n;
      var open = q ? true : !!S.open[key];

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

  function renderOverview() {
    var st = stats();
    var ws = windowStats();

    // Daily three: seeded by the date so the set is stable through the day.
    var pending = RATED.filter(function (x) { return !S.checked[x.id]; });
    var seed = 0, t = today();
    for (var i = 0; i < t.length; i++) seed = (seed * 31 + t.charCodeAt(i)) >>> 0;
    var quests = [];
    for (var k = 0; k < 3 && pending.length; k++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      quests.push(pending[seed % pending.length]);
    }

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
          }).join("") + "</ul>"
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

  function mbaRow(m) {
    var it = m.item;
    var dd = it.date ? daysUntil(it.date) : null;
    var lv = level(dd);
    var on = !!S.mba[it.id];
    var tags = (it.tags || []).map(function (tg) {
      var map = {
        confirmed: ["confirmed", "Confirmed date"],
        projected: ["projected", "Projected — verify"],
        oneshot: ["oneshot", "One shot only"],
        verify: ["verify", "Verification task"],
        action: ["", "Action"]
      };
      return map[tg] ? '<span class="tag ' + map[tg][0] + '">' + map[tg][1] + "</span>" : "";
    }).join("");

    return '<div class="row ' + lv + (on ? " on" : "") + '" data-mba="' + esc(it.id) + '">' +
      '<span class="box"></span><div class="rbody">' +
      '<div class="rtask">' + esc(it.task) + "</div>" +
      (it.note ? '<div class="rnote">' + esc(it.note) + "</div>" : "") +
      '<div class="rmeta">' +
      (it.date ? '<span class="rdate">' + fmtDate(it.date) + "</span>" +
        '<span class="rt ' + lv + '">' + tminus(dd) + "</span>" : '<span class="rt cool">NO DATE</span>') +
      tags + "</div></div></div>";
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
      var status = (S.opps[o.id] && S.opps[o.id].status) || (o.user && o.user.status) || "new";
      var dd = o.deadline ? daysUntil(o.deadline) : null;
      return '<div class="opp"><div class="opp-hd">' +
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
        "</div></div>";
    }).join("");
  }

  /* ---------------------------------------------------------- render */

  function render() {
    var tab = TABS.find(function (t) { return t.id === ACTIVE; }) || TABS[0];
    document.body.classList.toggle("domain-mba", tab.domain === "mba");

    var panel = document.getElementById("panel");
    if (tab.id === "overview") panel.innerHTML = renderOverview();
    else if (tab.id === "mba") panel.innerHTML = renderMba();
    else if (tab.id === "career") panel.innerHTML = renderCareer();
    else panel.innerHTML = renderTrack(tab.track);

    renderHeader();
    renderTabs();
    bind();
  }

  function markToday() {
    var t = today();
    if (S.days.indexOf(t) === -1) S.days.push(t);
  }

  function afterChange() {
    markToday();
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
        afterChange();
      };
    });

    // daily quests
    document.querySelectorAll(".quests li[data-id]").forEach(function (li) {
      li.onclick = function () {
        var id = li.dataset.id;
        if (S.checked[id]) delete S.checked[id]; else S.checked[id] = 1;
        afterChange();
      };
    });

    // MBA rows
    document.querySelectorAll(".row[data-mba]").forEach(function (row) {
      row.onclick = function () {
        var id = row.dataset.mba;
        if (S.mba[id]) delete S.mba[id]; else S.mba[id] = 1;
        markToday();
        save();
        render();
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

    // section collapse
    document.querySelectorAll(".section").forEach(function (sec) {
      var head = sec.querySelector(".sec-head");
      if (!head) return;
      head.onclick = function () {
        var key = sec.dataset.key;
        S.open[key] = !S.open[key];
        sec.classList.toggle("open");
        save();
      };
    });

    document.querySelectorAll(".btn[data-all]").forEach(function (b) {
      b.onclick = function () {
        var open = b.dataset.all === "1";
        document.querySelectorAll(".section").forEach(function (sec) {
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
    document.getElementById("loading").classList.add("hide");
    document.getElementById("panel").classList.remove("hide");
    render();
    if (memOnly) toast("Progress will not persist in this browser.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
