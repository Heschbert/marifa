/* Kurse: gezieltes Fachwissen statt Allgemeinwissen. Gleiche Struktur für jedes Thema:
   Kurs → Stufen (Grundlagen / Fortgeschritten / Experte) → Module → Lektionen.
   Jede Lektion: Lerntext mit Quellen → Karteikarten → Übung. Jedes Modul endet mit einem Modultest (ab 80 % bestanden),
   der das nächste Modul freischaltet. Am Ende eine Abschlussprüfung mit Zertifikat im Profil.
   Inhalte: data/courses/index.json + eine JSON-Datei je Kurs (Format siehe LEITFADEN-KURSE.md).
   Fragetypen: mc (eine richtig), multi (mehrere richtig), order (Reihenfolge), num (Zahl eingeben).
   Fortschritt: st.course[kursId] = { lessons, mods, final, qs, cards, last }. Wiederholung nach Plan wie im Lernmodus. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var PASS = 80, TEST_N = 15, FINAL_N = 20;
  var C = WF.courses = { list: [], byId: {}, loaded: false };

  function getJSON(u) { return fetch(u, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(u + " " + r.status); return r.json(); }); }
  C.load = function () {
    if (C.loaded) return Promise.resolve();
    return getJSON("data/courses/index.json").then(function (idx) {
      C.idx = idx;
      return Promise.all(idx.courses.map(function (f) { return getJSON("data/courses/" + f.file); }));
    }).then(function (arr) {
      C.list = arr; arr.forEach(prepare);
      arr.forEach(function (c, i) { c.fac = (C.idx.courses[i] || {}).fac || ""; });
      C.loaded = true;
    });
  };
  function prepare(c) {
    C.byId[c.id] = c; c.qs = []; c.cards = []; c.mById = {}; c.lById = {};
    c.modules.forEach(function (m) {
      m.course = c; m.qs = []; m.cards = []; c.mById[m.id] = m;
      (m.lessons || []).forEach(function (l) {
        l.mod = m; c.lById[l.id] = l;
        (l.qs || []).forEach(function (q) { q.lesson = l; m.qs.push(q); c.qs.push(q); });
        (l.cards || []).forEach(function (k) { k.lesson = l; m.cards.push(k); c.cards.push(k); });
      });
    });
  }
  function P(cid) {
    var st = S(), a = st.course || (st.course = {});
    return a[cid] || (a[cid] = { lessons: {}, mods: {}, final: null, qs: {}, cards: {}, last: null });
  }

  /* ---------- Status ---------- */
  function ready(m) { return m.lessons && m.lessons.length > 0; }
  function lessonDone(c, l) { return P(c.id).lessons[l.id] !== undefined; }
  function lessonsDone(m) { return m.lessons.filter(function (l) { return lessonDone(m.course, l); }).length; }
  function modPassed(m) { var r = P(m.course.id).mods[m.id]; return !!(r && r.pass); }
  function modOpen(m) {
    var c = m.course, prev = null;
    if (P(c.id).open) return ready(m);
    for (var i = 0; i < c.modules.length && c.modules[i] !== m; i++) if (ready(c.modules[i])) prev = c.modules[i];
    return ready(m) && (!prev || modPassed(prev));
  }
  function allPassed(c) { return !!P(c.id).open || c.modules.filter(ready).every(modPassed); }
  function progress(c) {
    var total = 1, done = 0;
    c.modules.filter(ready).forEach(function (m) { total += m.lessons.length + 1; done += lessonsDone(m) + (modPassed(m) ? 1 : 0); });
    var f = P(c.id).final; if (f && f.pass) done++;
    return total ? done / total * 100 : 0;
  }
  function due(c) {
    var p = P(c.id), t = U.today(), q = c.qs.filter(function (x) { var r = p.qs[x.id]; return r && r.due && r.due <= t; });
    var k = c.cards.filter(function (x) { var r = p.cards[x.id]; return r && r.due && r.due <= t; });
    return { q: q, k: k };
  }
  function sources(list) {
    if (!list || !list.length) return "";
    return '<ul class="srcs">' + list.map(function (s) { return "<li>" + (s.u ? '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.n) + "</a>" : esc(s.n)) + "</li>"; }).join("") + "</ul>";
  }
  /* Alter des Inhaltsstands in Monaten ("11/2026" → Monate bis heute). Lektionen mit vol: true veralten schnell. */
  function ageMonths(c) {
    var m = /^(\d{1,2})\/(\d{4})$/.exec(c.stand || ""); if (!m) return 0;
    var d = new Date(); return (d.getFullYear() - +m[2]) * 12 + (d.getMonth() + 1 - +m[1]);
  }
  function volNote(c, l) {
    if (!l.vol) return "";
    var old = ageMonths(c) >= 6;
    return '<div class="card ' + (old ? "volold" : "vol") + '"><b>' + (old ? "⚠ Stand älter als 6 Monate" : "Stand " + esc(c.stand)) + '</b><p class="small mute" style="margin:2px 0 0">' +
      (old ? "Diese Lektion behandelt Regeln oder Marktdaten, die sich oft ändern (Stand " + esc(c.stand) + "). Vor Entscheidungen die Quellen prüfen." : "Regeln oder Marktdaten, die sich oft ändern. Vor Entscheidungen die Quellen prüfen.") + "</p></div>";
  }
  function withCourses(f) { if (C.loaded) return f(); ui.loading(); C.load().then(f).catch(function (e) { ui.failed(String(e && e.message || e)); }); }

  /* ---------- Bildschirme ---------- */
  /* Kursübersicht wie eine Universität: Fakultäten mit ihren Kursen; geplante Kurse sind sichtbar, aber noch gesperrt */
  function list() {
    ui.setView(function () { withCourses(list); });
    var h = ui.sechead("course", "Kurse", "Deine Uni: Fachwissen Schritt für Schritt, vom Einstieg bis zum Experten.");
    /* Kompakt: Fakultät als kleine Überschrift, Kurse als einzeilige Karten, geplante Kurse als Chips */
    var lastC = null; C.list.forEach(function (c) { var p = P(c.id); if (p.last && c.lById[p.last] && (!lastC || (p.at || 0) > (P(lastC.id).at || 0))) lastC = c; });
    if (lastC) { var ll = lastC.lById[P(lastC.id).last]; h += '<button class="cgo" data-act="cles" data-c="' + esc(lastC.id) + '" data-l="' + esc(ll.id) + '"><span class="cgoic" aria-hidden="true">▶</span><span class="grow"><span class="small">Weiter in ' + esc(lastC.title) + "</span><b>" + esc(ll.title) + "</b></span></button>"; }
    (C.idx.faculties || [{ id: "", t: "Kurse", ico: "🎓", sub: "" }]).forEach(function (f) {
      var cs = C.list.filter(function (c) { return (c.fac || "") === f.id; }), pl = (C.idx.planned || []).filter(function (x) { return x.fac === f.id; });
      if (!cs.length && !pl.length) return;
      h += '<div class="fac"><span class="facic" aria-hidden="true">' + esc(f.ico) + "</span><b>" + esc(f.t) + "</b></div>";
      cs.forEach(function (c) {
        var p = progress(c), d = due(c), n = d.q.length + d.k.length, les = 0; c.modules.forEach(function (m) { les += (m.lessons || []).length; });
        h += '<button class="ccard2" data-act="crs1" data-c="' + esc(c.id) + '">' + ui.ring(p, "var(--course)", Math.round(p) + "%") +
          '<span class="grow"><b>' + esc(c.title) + '</b><span class="small mute">' + c.modules.length + " Module · " + les + " Lektionen" + (n ? ' · <b class="due">' + n + " fällig</b>" : "") + "</span></span>" +
          '<span class="chev" aria-hidden="true">›</span></button>';
      });
      if (pl.length) h += '<details class="cplan" data-keep="cplan-' + esc(f.id) + '"><summary class="small mute">' + (pl.length === 1 ? "1 Kurs" : pl.length + " Kurse") + " in Vorbereitung</summary><div>" + pl.map(function (x) { return '<span class="cpchip" title="' + esc(x.sub) + '">' + esc(x.t) + "</span>"; }).join("") + "</div></details>";
    });
    ui.show(h, "courses", "course");
  }
  function course(cid) {
    var c = C.byId[cid]; if (!c) return list();
    ui.setView(function () { withCourses(function () { course(cid); }); });
    var p = P(cid), pr = progress(c), d = due(c), n = d.q.length + d.k.length, last = p.last && c.lById[p.last];
    var h = '<button class="ghost" data-act="crs">‹ Kurse</button><h1>' + esc(c.title) + '</h1><p class="mute">' + esc(c.sub) + "</p>";
    h += '<div class="card ksum">' + ui.ring(pr, "var(--course)", Math.round(pr) + "%") + '<div class="grow"><b>Kursfortschritt ' + Math.round(pr) + ' %</b><p class="small mute" style="margin:2px 0 0">Zielgruppe: ' + esc(c.audience) + " · Stand " + esc(c.stand) + "</p></div></div>";
    if (last) h += '<div class="hero"><h3>Weiter mit</h3><p>' + esc(last.title) + "</p>" + btn("cles", "Lektion öffnen", { data: { c: cid, l: last.id } }) + "</div>";
    if (n) h += ui.row("crev", "↻", "Wiederholen", n + " fällig (" + d.q.length + " Fragen, " + d.k.length + " Karten)", { c: cid });
    h += ui.row("cgloss", "A–Z", "Glossar", c.cards.length + " Begriffe zum Nachschlagen", { c: cid });
    var vols = 0; c.modules.forEach(function (m) { m.lessons.forEach(function (l) { if (l.vol) vols++; }); });
    if (vols && ageMonths(c) >= 6) h += '<div class="card volold"><b>⚠ Teile des Kurses sind älter als 6 Monate</b><p class="small mute" style="margin:2px 0 0">' + vols + " Lektionen mit Regeln oder Marktdaten haben den Stand " + esc(c.stand) + ". Bitte vor Entscheidungen prüfen.</p></div>";
    /* Lernpfad wie in einer Sprach-App: Lektionen als Stationen, die sich nacheinander freischalten; am Ende jedes Moduls der Test */
    h += '<div class="cpath">';
    var k = 0, curSet = false;
    c.levels.forEach(function (lv) {
      var mods = c.modules.filter(function (m) { return m.level === lv.id; }); if (!mods.length) return;
      h += '<div class="plevel">Stufe ' + lv.id + " · " + esc(lv.title) + "</div>";
      mods.forEach(function (m) {
        var open = modOpen(m), passed = modPassed(m);
        h += '<button class="pmod' + (open ? "" : " off") + '" data-act="cmod" data-c="' + esc(cid) + '" data-m="' + esc(m.id) + '"><b>' + esc(m.title) + '</b><span class="small">' + esc(m.desc) + "</span>" +
          '<span class="pmst">' + (!ready(m) ? "In Vorbereitung" : passed ? "Bestanden · " + p.mods[m.id].best + " %" : !open ? "🔒 Erst das vorige Modul bestehen" : lessonsDone(m) + " von " + m.lessons.length + " Lektionen") + "</span></button>";
        (m.lessons || []).forEach(function (l, i) {
          var done = lessonDone(c, l), avail = open && (i === 0 || lessonDone(c, m.lessons[i - 1]) || !!p.open), isCur = !done && avail && !curSet;
          if (isCur) curSet = true;
          var cls = done ? "done" : isCur ? "cur" : avail ? "open" : "lock";
          h += '<div class="pnode-wrap pos' + (k++ % 4) + '"><button class="pnode ' + cls + '" data-act="' + (avail || done ? "cles" : "clock") + '" data-c="' + esc(cid) + '" data-l="' + esc(l.id) + '" aria-label="' + esc(l.title) + '">' +
            (done ? "✓" : avail ? String(i + 1) : "🔒") + "</button>" + '<span class="plabel">' + (isCur ? "<b>Start</b> · " : "") + esc(l.title) + "</span></div>";
        });
        if (ready(m)) {
          var all = lessonsDone(m) === m.lessons.length || !!p.open;
          h += '<div class="pnode-wrap pos' + (k++ % 4) + '"><button class="pnode test ' + (passed ? "done" : all ? "open" : "lock") + '" data-act="' + (all ? "ctest" : "clock") + '" data-c="' + esc(cid) + '" data-m="' + esc(m.id) + '" aria-label="Modultest">🏆</button><span class="plabel">Modultest' + (passed ? " · bestanden" : "") + "</span></div>";
        }
      });
    });
    h += "</div>";
    var op = P(cid).open;
    h += '<div class="card unlock"><div class="grow"><b>' + (op ? "Alle Module freigeschaltet" : "Module der Reihe nach") + '</b><div class="small mute">' + (op ? "Jedes Modul und jeder Test ist sofort verfügbar." : "Ein Modul öffnet sich nach bestandenem Test des vorigen.") + "</div></div>" + '<button class="link" data-act="copen" data-c="' + esc(cid) + '">' + (op ? "Reihenfolge an" : "Alle freischalten") + "</button></div>";
    h += "<h2>Abschluss</h2>";
    var f = p.final;
    if (f && f.pass) h += '<div class="card cert"><b>🎓 Zertifikat: ' + esc(c.title) + '</b><p class="small mute">Abschlussprüfung bestanden am ' + esc(f.at.split("-").reverse().join(".")) + " mit " + f.best + " %. Gilt für den bisher verfügbaren Kursinhalt.</p></div>";
    h += btn("cfinal", "Abschlussprüfung", { sub: allPassed(c) ? FINAL_N + " Fragen aus allen Modulen · ab " + PASS + " % bestanden" : "Erst alle verfügbaren Module bestehen", off: !allPassed(c), data: { c: cid } });
    h += '<div class="card" style="margin-top:16px"><b>Qualität</b><p class="small mute" style="margin:4px 0 0">' + esc(c.review) + " Jede Lektion nennt ihre Quellen und ihren Stand. Fehler kannst du bei jeder Frage melden.</p></div>";
    ui.show(h, "courses", "course");
  }
  function mod(cid, mid) {
    var c = C.byId[cid], m = c && c.mById[mid]; if (!m) return list();
    ui.setView(function () { withCourses(function () { mod(cid, mid); }); });
    var p = P(cid), r = p.mods[mid], ld = lessonsDone(m), all = ld === m.lessons.length || !!p.open;
    var h = '<button class="ghost" data-act="crs1" data-c="' + esc(cid) + '">‹ ' + esc(c.title) + "</button><h1>" + esc(m.title) + '</h1><p class="mute">' + esc(m.desc) + "</p>";
    h += ui.bar(ld / m.lessons.length * 100, "Lektionen") + '<p class="small mute" style="margin-top:6px">' + ld + " von " + m.lessons.length + " Lektionen erledigt</p>";
    h += "<h2>Lektionen</h2>";
    m.lessons.forEach(function (l, i) {
      var b = p.lessons[l.id];
      h += ui.row("cles", b !== undefined ? "✓" : String(i + 1), l.title, l.min + " Min. · " + l.qs.length + " Fragen · " + l.cards.length + " Karten" + (b !== undefined ? " · Übung " + b + " %" : ""), { c: cid, l: l.id });
    });
    h += "<h2>Trainieren</h2>" + '<div class="grid2">' + btn("ccards", "Karteikarten", { sub: m.cards.length + " Karten", data: { c: cid, m: mid } }) +
      btn("ctest", "Modultest", { primary: all, off: !all, sub: all ? TEST_N + " Fragen · ab " + PASS + " %" : "Erst alle Lektionen", data: { c: cid, m: mid } }) + "</div>";
    if (r) h += '<p class="small mute" style="margin-top:8px">Bestes Testergebnis: ' + r.best + " %" + (r.pass ? " · bestanden" : "") + "</p>";
    ui.show(h, "courses", "course");
  }
  function lesson(cid, lid) {
    var c = C.byId[cid], l = c && c.lById[lid]; if (!l) return list();
    ui.setView(function () { withCourses(function () { lesson(cid, lid); }); });
    P(cid).last = lid; P(cid).at = Date.now(); WF.store.save();
    var h = '<button class="ghost" data-act="cmod" data-c="' + esc(cid) + '" data-m="' + esc(l.mod.id) + '">‹ ' + esc(l.mod.title) + "</button><h1>" + esc(l.title) + '</h1><p class="small mute">' + l.min + " Minuten Lesezeit · Stand " + esc(c.stand) + "</p>";
    h += volNote(c, l);
    h += '<article class="lesson">';
    l.body.forEach(function (t, i) {
      h += t.indexOf("## ") === 0 ? "<h3>" + esc(t.slice(3)) + "</h3>" : "<p>" + esc(t) + "</p>";
      (l.figs || []).forEach(function (f) { if (f.after === i) h += f.w && WF.kw ? WF.kw.html(f) : '<figure class="fig"><img src="' + esc(f.src) + '" alt="' + esc(f.cap) + '" loading="lazy"><figcaption>' + esc(f.cap) + "</figcaption></figure>"; });
    });
    h += "</article>";
    if (l.key && l.key.length) h += '<div class="card keybox"><b>Das Wichtigste</b><ul>' + l.key.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") + "</ul></div>";
    h += '<details class="card"><summary><b>Quellen</b> <span class="small mute">(' + l.src.length + ")</span></summary>" + sources(l.src) + "</details>";
    h += '<div class="grid2" style="margin-top:12px">' + btn("ccards", "Karteikarten", { sub: l.cards.length + " Karten", data: { c: cid, l: lid } }) + btn("cprac", "Übung starten", { primary: true, sub: l.qs.length + " Fragen", data: { c: cid, l: lid } }) + "</div>";
    ui.show(h, "courses", "course");
    if (WF.kw) WF.kw.mount();
  }
  /* Glossar: alle Karteikarten des Kurses A–Z, mit Suche */
  function gloss(cid, q) {
    var c = C.byId[cid]; if (!c) return list();
    ui.setView(function () { withCourses(function () { gloss(cid, q); }); });
    var h = '<button class="ghost" data-act="crs1" data-c="' + esc(cid) + '">‹ ' + esc(c.title) + '</button><h1>Glossar</h1>' +
      '<input class="search" id="gq" data-input="cgq" data-c="' + esc(cid) + '" placeholder="Begriff suchen …" autocomplete="off" value="' + esc(q || "") + '"><div id="glist">' + glossList(c, q) + "</div>";
    ui.show(h, "courses", "course");
    var i = document.getElementById("gq"); if (i && q) { i.focus(); i.setSelectionRange(q.length, q.length); }
  }
  function glossList(c, q) {
    var t = (q || "").toLowerCase().trim(), items = c.cards.slice().sort(function (a, b) { return a.f.localeCompare(b.f, "de"); }), seen = {}, h = "", letter = "";
    items.forEach(function (k) {
      if (seen[k.f]) return; seen[k.f] = 1;
      if (t && (k.f + " " + k.b).toLowerCase().indexOf(t) < 0) return;
      var L = k.f.charAt(0).toUpperCase(); if (!t && L !== letter) { letter = L; h += "<h2>" + esc(L) + "</h2>"; }
      h += '<div class="card gl"><b>' + esc(k.f) + '</b><p class="small" style="margin:4px 0 0">' + esc(k.b) + '</p><button class="link small" data-act="cles" data-c="' + esc(c.id) + '" data-l="' + esc(k.lesson.id) + '">' + esc(k.lesson.title) + " ›</button></div>";
    });
    return h || '<p class="mute">Kein Begriff gefunden.</p>';
  }
  H.cgloss = function (d) { withCourses(function () { gloss(d.c, ""); }); };
  H.cgq = function (inp) { var c = C.byId[inp.dataset.c]; if (c) document.getElementById("glist").innerHTML = glossList(c, inp.value); };
  ui.views = ui.views || {};
  ui.views.courses = function () { withCourses(list); };
  H.copen = function (d) { var p = P(d.c); p.open = !p.open; WF.store.save(); course(d.c); };
  H.crs = function () { withCourses(list); };
  H.crs1 = function (d) { withCourses(function () { course(d.c); }); };
  H.clock = function () { ui.toast({ title: "Noch gesperrt", sub: "Erst die vorige Station abschließen. Oder unten „Alle Module freischalten“." }); };
  H.cmod = function (d) { withCourses(function () { mod(d.c, d.m); }); };
  /* Kopfband-Symbol bei Kurse: letzte Lektion fortsetzen, sonst den ersten Kurs öffnen */
  H.cgoany = function () {
    withCourses(function () {
      var best = null;
      C.list.forEach(function (c) { var p = P(c.id), l = p.last && c.lById[p.last]; if (l && !best) best = { c: c, l: l }; });
      if (best) lesson(best.c.id, best.l.id); else if (C.list[0]) course(C.list[0].id);
    });
  };
  H.cles = function (d) { withCourses(function () { lesson(d.c, d.l); }); };

  /* ---------- Übung, Test, Wiederholung ---------- */
  var Q = null;
  function runQuiz(cfg) {
    Q = { cfg: cfg, list: cfg.items.slice(), i: 0, first: {}, ok: 0, n: cfg.items.length, wrong: [], again: {} };
    qShow();
  }
  H.cprac = function (d) { var c = C.byId[d.c], l = c.lById[d.l]; runQuiz({ c: c, kind: "practice", lesson: l, title: l.title, items: U.shuffle(l.qs.slice()) }); };
  H.ctest = function (d) { var c = C.byId[d.c], m = c.mById[d.m]; runQuiz({ c: c, kind: "test", mod: m, title: "Modultest · " + m.title, items: U.shuffle(m.qs.slice()).slice(0, TEST_N) }); };
  H.cfinal = function (d) { var c = C.byId[d.c]; if (!allPassed(c)) return; runQuiz({ c: c, kind: "final", title: "Abschlussprüfung · " + c.title, items: U.shuffle(c.qs.slice()).slice(0, FINAL_N) }); };
  H.crev = function (d) {
    var c = C.byId[d.c], du = due(c);
    if (du.q.length) runQuiz({ c: c, kind: "review", title: "Wiederholen · " + c.title, items: U.shuffle(du.q).slice(0, TEST_N) });
    else if (du.k.length) runCards({ c: c, title: "Wiederholen · " + c.title, items: du.k });
  };
  function cur() { return Q.list[Q.i]; }
  function perm(q) { if (!q._p) q._p = U.shuffle(q.o.map(function (_, i) { return i; })); return q._p; }
  function qShow() {
    var q = cur(); Q.sel = []; Q.done = false; q._p = null;
    var test = Q.cfg.kind === "test" || Q.cfg.kind === "final";
    var h = '<div class="topbar"><button class="ghost" data-act="cquit">✕ Beenden</button><span class="chip">' + Math.min(Q.i + 1, Q.list.length) + " / " + Q.list.length + "</span></div>" + ui.bar(Q.i / Q.list.length * 100, "Fortschritt");
    h += '<div class="qmeta">' + esc(test ? Q.cfg.title : q.lesson.title) + (Q.again[q.id] ? " · Wiederholung" : "") + '</div><p class="q">' + esc(q.q) + "</p>";
    if (q.t === "mc" || q.t === "multi") {
      if (q.t === "multi") h += '<p class="small mute" style="margin:-8px 0 12px">Mehrere Antworten richtig. Wähle alle passenden.</p>';
      h += '<div id="opts" role="group" aria-label="Antworten">';
      perm(q).forEach(function (k) { h += '<button class="ans" data-act="cpick" data-k="' + k + '" aria-pressed="false">' + esc(q.o[k]) + "</button>"; });
      h += "</div>";
      if (q.t === "multi") h += btn("ccheck", "Prüfen", { primary: true });
    } else if (q.t === "order") {
      h += '<p class="small mute" style="margin:-8px 0 12px">Tippe in der richtigen Reihenfolge an.</p><div id="copts" role="group" aria-label="Elemente">';
      perm(q).forEach(function (k) { h += '<button class="ans tl" data-act="cord" data-k="' + k + '"><span class="num" aria-hidden="true"></span><span>' + esc(q.o[k]) + "</span></button>"; });
      h += "</div>" + btn("ccheck", "Prüfen", { primary: true });
    } else if (q.t === "num") {
      h += '<div class="numin"><input id="cnum" inputmode="none" autocomplete="off" placeholder="Zahl oder Rechnung" aria-label="Antwort in ' + esc(q.unit || "") + '"><span>' + esc(q.unit || "") + '</span></div><div class="calcres small mute" id="cres" aria-live="polite"></div>' + calcPad() + btn("ccheck", "Prüfen", { primary: true });
    }
    h += '<div id="fb" aria-live="polite"></div>';
    ui.show(h, null, "course");
    var inp = document.getElementById("cnum");
    if (inp) { inp.addEventListener("keydown", function (e) { if (e.key === "Enter") H.ccheck(); }); inp.addEventListener("input", calcShow); }
  }
  /* ---------- Taschenrechner für Zahlenfragen ----------
     Eigener kleiner Parser (kein eval, CSP-tauglich): + − × ÷ ^ √ und Klammern, Komma als Dezimaltrennzeichen. */
  function numTok(t) {
    /* Komma = Dezimaltrennzeichen; Punkt nur als Tausendertrennzeichen, wenn danach genau drei Ziffern folgen (7.300) */
    if (t.indexOf(",") >= 0) t = t.replace(/\./g, "").replace(",", "."); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    return /^(\d+\.?\d*|\.\d+)$/.test(t) ? parseFloat(t) : NaN;
  }
  function calc(str) {
    var s = String(str || "").replace(/\s/g, "").replace(/[×*]/g, "*").replace(/[÷:/]/g, "/").replace(/[−–]/g, "-");
    if (!s) return null;
    var toks = s.match(/[\d.,]+|[-+*/^()√]/g); if (!toks || toks.join("") !== s) return null;
    var i = 0;
    function peek() { return toks[i]; }
    function expr() { var v = term(); while (peek() === "+" || peek() === "-") { var o = toks[i++], r = term(); v = o === "+" ? v + r : v - r; } return v; }
    function term() { var v = unary(); while (peek() === "*" || peek() === "/") { var o = toks[i++], r = unary(); v = o === "*" ? v * r : v / r; } return v; }
    function unary() { if (peek() === "-") { i++; return -unary(); } if (peek() === "+") { i++; return unary(); } if (peek() === "√") { i++; return Math.sqrt(unary()); } return power(); }
    function power() { var b = prim(); if (peek() === "^") { i++; return Math.pow(b, unary()); } return b; }
    function prim() { var t = toks[i++]; if (t === "(") { var v = expr(); if (toks[i] === ")") i++; return v; } if (t === undefined) return NaN; return numTok(t); }
    var v = expr();
    return i === toks.length && isFinite(v) ? v : null;
  }
  function calcFmt(v) { return (Math.round(v * 1e6) / 1e6).toLocaleString("de-DE", { maximumFractionDigits: 6 }); }
  function calcShow() {
    var inp = document.getElementById("cnum"), out = document.getElementById("cres"); if (!inp || !out) return;
    var t = inp.value, v = calc(t);
    out.textContent = /[-+×÷*/^√()−]/.test(t.replace(/^-/, "")) ? (v === null ? "Rechnung unvollständig" : "= " + calcFmt(v)) : "";
  }
  function calcPad() {
    var K = ["7", "8", "9", "(", ")", "4", "5", "6", "×", "÷", "1", "2", "3", "+", "−", "0", ",", "^", "√", "⌫"];
    return '<div class="calc" role="group" aria-label="Taschenrechner">' + K.map(function (k) { return '<button class="ck' + (/\d|,/.test(k) ? "" : " op") + '" data-act="ckey" data-k="' + k + '"' + (k === "⌫" ? ' aria-label="Löschen"' : "") + ">" + k + "</button>"; }).join("") +
      '<button class="ck op wide2" data-act="ckey" data-k="C">C</button><button class="ck eq wide3" data-act="ckey" data-k="=">=</button></div>';
  }
  H.ckey = function (d) {
    var inp = document.getElementById("cnum"); if (!inp || inp.disabled) return;
    if (d.k === "C") inp.value = ""; else if (d.k === "⌫") inp.value = inp.value.slice(0, -1);
    else if (d.k === "=") { var v = calc(inp.value); if (v === null) return ui.toast({ title: "Rechnung unvollständig" }); inp.value = calcFmt(v).replace(/\./g, ""); }
    else inp.value += d.k;
    calcShow();
  };
  H.cpick = function (d, t) {
    var q = cur(); if (Q.done) return;
    if (q.t === "mc") return finish(+d.k === q.a, [+d.k]);
    var k = +d.k, i = Q.sel.indexOf(k);
    if (i >= 0) Q.sel.splice(i, 1); else Q.sel.push(k);
    t.classList.toggle("sel", i < 0); t.setAttribute("aria-pressed", String(i < 0));
  };
  H.cord = function (d) {
    var q = cur(); if (Q.done) return;
    var k = +d.k, i = Q.sel.indexOf(k);
    if (i >= 0) Q.sel.splice(i, 1); else Q.sel.push(k);
    [].forEach.call(document.querySelectorAll("#copts .ans"), function (b) { var p = Q.sel.indexOf(+b.dataset.k); b.classList.toggle("sel", p >= 0); b.querySelector(".num").textContent = p >= 0 ? p + 1 : ""; });
  };
  H.ccheck = function () {
    var q = cur(); if (Q.done) return;
    if (q.t === "multi") { if (!Q.sel.length) return ui.toast({ title: "Wähle mindestens eine Antwort" }); var a = q.a.slice().sort().join(), s = Q.sel.slice().sort().join(); return finish(a === s, Q.sel); }
    if (q.t === "order") { if (Q.sel.length < q.o.length) return ui.toast({ title: "Noch " + (q.o.length - Q.sel.length) + " antippen" }); return finish(Q.sel.every(function (k, i) { return k === i; }), Q.sel); }
    if (q.t === "num") {
      var v = calc(document.getElementById("cnum").value);
      if (v === null) return ui.toast({ title: "Bitte eine Zahl oder gültige Rechnung eingeben" });
      return finish(Math.abs(v - q.a) <= (q.tol || 0), [v]);
    }
  };
  function rightText(q) {
    if (q.t === "mc") return q.o[q.a];
    if (q.t === "multi") return q.a.map(function (k) { return q.o[k]; }).join(" · ");
    if (q.t === "order") return q.o.join(" → ");
    return String(q.a).replace(".", ",") + " " + (q.unit || "");
  }
  function finish(ok, given) {
    var q = cur(), c = Q.cfg.c, p = P(c.id), firstTry = !Q.first[q.id];
    Q.done = true;
    /* Markieren */
    if (q.t === "mc" || q.t === "multi") {
      var right = q.t === "mc" ? [q.a] : q.a;
      [].forEach.call(document.querySelectorAll("#opts .ans"), function (b) {
        var k = +b.dataset.k, chosen = given.indexOf(k) >= 0, r = right.indexOf(k) >= 0; b.disabled = true; b.classList.remove("sel");
        b.classList.add(r ? "ok" : chosen ? "bad" : "dim");
      });
    } else if (q.t === "order") {
      [].forEach.call(document.querySelectorAll("#copts .ans"), function (b) { var k = +b.dataset.k; b.disabled = true; b.classList.add(given.indexOf(k) === k ? "ok" : "bad"); });
    } else { var inp = document.getElementById("cnum"); inp.disabled = true; inp.classList.add(ok ? "ok" : "bad"); }
    [].forEach.call(document.querySelectorAll('[data-act="ccheck"], .calc'), function (b) { b.remove(); });
    /* Werten: nur der erste Versuch zählt für das Ergebnis */
    var gain = 0;
    if (firstTry) {
      Q.first[q.id] = ok ? 1 : -1; if (ok) Q.ok++; else Q.wrong.push(q);
      var rec = p.qs[q.id] || (p.qs[q.id] = { b: 0 }); E.schedule(rec, ok);
      gain = ok ? 10 : 2; E.addXP(gain); E.registerPlay();
    }
    if (!ok && Q.cfg.kind === "practice" && !Q.again[q.id]) { Q.again[q.id] = 1; Q.list.push(q); }
    WF.store.save();
    WF.emit("answered", { ok: ok, gain: gain, x: { retry: !firstTry, c: c.title, id: q.id }, course: true });
    var f = '<div class="fb ' + (ok ? "ok" : "bad") + '"><b class="h">' + (ok ? "Richtig" : "Nicht ganz") + (gain ? " · +" + gain + " XP" : "") + "</b>" +
      (ok ? "" : "<p>Richtig: <b>" + esc(rightText(q)) + "</b></p>") + (q.e ? '<p class="small">' + esc(q.e) + "</p>" : "") +
      '<p class="small mute" style="margin:6px 0 0">Aus: ' + esc(q.lesson.title) + ' · <button class="link" data-act="creport">Fehler melden</button></p></div>';
    f += btn("cnext", Q.i + 1 >= Q.list.length ? "Ergebnis" : "Weiter", { primary: true });
    document.getElementById("fb").innerHTML = f;
    var nb = document.querySelector('[data-act="cnext"]'); if (nb) { nb.scrollIntoView({ behavior: ui.reduced() ? "auto" : "smooth", block: "nearest" }); }
  }
  H.creport = function (d, t) {
    var q = cur(), l = S().reports || (S().reports = []);
    if (!l.some(function (r) { return r.id === q.id; })) { l.push({ id: q.id, q: q.q, a: rightText(q), c: Q.cfg.c.title, s: q.lesson.title, at: U.today() }); WF.store.save(); }
    t.outerHTML = '<span class="mute">Gemeldet. Die Liste steht im Profil.</span>';
  };
  H.cnext = function () { Q.i++; if (Q.i >= Q.list.length) return qEnd(); qShow(); };
  H.cquit = function () { if (Object.keys(Q.first).length) qEnd(true); else back(); };
  function back() {
    var k = Q.cfg;
    if (k.lesson) return lesson(k.c.id, k.lesson.id);
    if (k.mod) return mod(k.c.id, k.mod.id);
    return course(k.c.id);
  }
  H.cback = function () { back(); };
  function qEnd(aborted) {
    var k = Q.cfg, c = k.c, p = P(c.id), n = Object.keys(Q.first).length, pct = n ? Math.round(Q.ok / (aborted ? n : Q.n) * 100) : 0, msg = "", pass = pct >= PASS && !aborted;
    if (k.kind === "practice" && !aborted) { p.lessons[k.lesson.id] = Math.max(p.lessons[k.lesson.id] || 0, pct); msg = "Lektion erledigt."; }
    if (k.kind === "test") {
      var r = p.mods[k.mod.id] || (p.mods[k.mod.id] = { best: 0, pass: false }), firstPass = pass && !r.pass;
      if (!aborted) r.best = Math.max(r.best, pct);
      if (pass) r.pass = true;
      if (firstPass) { E.addXP(50); WF.emit("celebrate", { icon: "✓", kind: "course", title: "Modul bestanden", sub: k.mod.title + " · +50 XP" }); }
      msg = pass ? "Bestanden. Das nächste Modul ist frei." : aborted ? "Abgebrochen." : "Noch nicht bestanden. Ab " + PASS + " % geht es weiter.";
    }
    if (k.kind === "final") {
      var f = p.final, firstF = pass && !(f && f.pass);
      if (pass) p.final = { pass: true, best: Math.max(pct, (f && f.best) || 0), at: (f && f.pass && f.at) || U.today() };
      if (firstF) { E.addXP(150); WF.emit("celebrate", { icon: "🎓", kind: "course", title: "Zertifikat erhalten", sub: c.title + " · +150 XP" }); }
      msg = pass ? "Bestanden. Dein Zertifikat steht im Kurs und im Profil." : aborted ? "Abgebrochen." : "Noch nicht bestanden. Ab " + PASS + " % gibt es das Zertifikat.";
    }
    WF.store.save();
    var h = "<h1>" + esc(k.title) + '</h1><div class="score">' + pct + ' %</div><p class="mute">' + Q.ok + " von " + (aborted ? n : Q.n) + " beim ersten Versuch richtig. " + esc(msg) + "</p>";
    if ((k.kind === "test" || k.kind === "final") && !aborted) h += '<div class="card ' + (pass ? "cert" : "note") + '"><b>' + (pass ? "✓ Bestanden" : "Ziel: " + PASS + " %") + "</b></div>";
    if (Q.wrong.length) {
      h += "<h2>Zum Nachlesen</h2><div class=\"card\">";
      Q.wrong.forEach(function (q) { h += '<div class="wrong"><b>' + esc(q.q) + "</b><br>Richtig: " + esc(rightText(q)) + (q.e ? '<br><span class="mute">' + esc(q.e) + "</span>" : "") + '<br><button class="link" data-act="cles" data-c="' + esc(c.id) + '" data-l="' + esc(q.lesson.id) + '">Lektion „' + esc(q.lesson.title) + '“ öffnen</button></div>'; });
      h += "</div>";
    }
    h += '<div style="margin:16px 0">' + btn("cback", "Zurück", { primary: true }) + "</div>";
    ui.show(h, null, "course");
  }

  /* ---------- Karteikarten ---------- */
  var K = null;
  function runCards(cfg) {
    var p = P(cfg.c.id), t = U.today();
    /* Fällige und neue zuerst, schon sichere zuletzt */
    var items = cfg.items.slice().sort(function (a, b) { function key(x) { var r = p.cards[x.id]; return !r ? 1 : r.due && r.due <= t ? 0 : 2 + r.b; } return key(a) - key(b); });
    K = { cfg: cfg, list: items, i: 0, known: 0, again: {} }; kShow();
  }
  H.ccards = function (d) {
    var c = C.byId[d.c];
    if (d.l) { var l = c.lById[d.l]; runCards({ c: c, lesson: l, title: l.title, items: l.cards }); }
    else { var m = c.mById[d.m]; runCards({ c: c, mod: m, title: m.title, items: m.cards }); }
  };
  function kShow() {
    var k = K.list[K.i];
    var h = '<div class="topbar"><button class="ghost" data-act="kquit">✕ Beenden</button><span class="chip">' + (K.i + 1) + " / " + K.list.length + "</span></div>" + ui.bar(K.i / K.list.length * 100, "Fortschritt");
    h += '<div class="qmeta">Karteikarten · ' + esc(K.cfg.title) + "</div>";
    h += '<button class="flash" data-act="kflip" aria-live="polite"><span class="small mute">Begriff</span><b>' + esc(k.f) + '</b><span class="small mute">Antippen zum Umdrehen</span></button>';
    ui.show(h, null, "course");
  }
  H.kflip = function (d, t) {
    var k = K.list[K.i]; if (t.classList.contains("back")) return;
    t.classList.add("back"); t.innerHTML = '<span class="small mute">' + esc(k.f) + "</span><p>" + esc(k.b) + "</p>";
    t.insertAdjacentHTML("afterend", '<div class="grid2" style="margin-top:12px">' + btn("kans", "Nochmal", { data: { v: 0 } }) + btn("kans", "Wusste ich", { primary: true, data: { v: 1 } }) + "</div>");
  };
  H.kans = function (d) {
    var k = K.list[K.i], ok = d.v === "1", p = P(K.cfg.c.id);
    if (!K.again[k.id]) { var r = p.cards[k.id] || (p.cards[k.id] = { b: 0 }); E.schedule(r, ok); if (ok) { K.known++; E.addXP(2); } E.registerPlay(); WF.emit("courseCard", { ok: ok }); }
    if (!ok && !K.again[k.id]) { K.again[k.id] = 1; K.list.push(k); }
    WF.store.save();
    K.i++; if (K.i >= K.list.length) return kEnd(); kShow();
  };
  H.kquit = function () { kEnd(); };
  function kEnd() {
    var k = K.cfg, total = K.list.length - Object.keys(K.again).length;
    Q = { cfg: k };
    ui.show("<h1>Karteikarten</h1>" + '<div class="score">' + K.known + " von " + total + '</div><p class="mute">beim ersten Mal gewusst. Was du nicht wusstest, kommt bald wieder.</p>' +
      '<div style="margin:16px 0">' + (k.lesson ? btn("cprac", "Jetzt üben", { primary: true, data: { c: k.c.id, l: k.lesson.id } }) + '<div style="height:8px"></div>' : "") + btn("cback", "Zurück", { primary: !k.lesson }) + "</div>", null, "course");
  }

  /* ---------- Einträge in anderen Bereichen ---------- */
  WF.registerEntry({ where: "today", order: 5, render: function () {
    if (!C.loaded) return "";
    var best = null, dueN = 0;
    C.list.forEach(function (c) { var p = P(c.id), l = p.last && c.lById[p.last]; if (l && !best) best = { c: c, l: l }; var d = due(c); dueN += d.q.length + d.k.length; });
    if (!best) return "";
    return '<button class="trow" data-act="cles" data-c="' + best.c.id + '" data-l="' + best.l.id + '"><span class="tic">🎓</span><span class="grow"><b>Kurs: ' + esc(best.l.title) + '</b><span class="small mute">' + esc(best.c.title) + (dueN ? " · " + dueN + " zum Wiederholen" : "") + '</span></span><span class="tgo">Weiter</span></button>';
  } });
  WF.registerEntry({ where: "profiletop", order: 5, render: function () {
    if (!C.loaded) return "";
    var h = "";
    C.list.forEach(function (c) { var f = P(c.id).final; if (f && f.pass) h += '<div class="card cert"><b>🎓 ' + esc(c.title) + '</b><p class="small mute">Zertifikat vom ' + esc(f.at.split("-").reverse().join(".")) + " · " + f.best + " %</p></div>"; });
    return h ? "<h2>Zertifikate</h2>" + h : "";
  } });
  WF.on("ready", function () { C.load().then(function () { ui.refreshTab(); }).catch(function (e) { console.error(e); }); });
})();
