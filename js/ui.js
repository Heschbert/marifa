/* Oberfläche: Bildschirme und Bedienung. Enthält keine Spiellogik, die steckt in engine.js und modes.js. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc;
  function S() { return WF.store.data; }
  var app = document.getElementById("app"), tabs = document.getElementById("tabs"), toastEl = document.getElementById("toast");
  var tick = null, H = {}, ui = WF.ui = {}, openState = {};

  function stopTick() { if (tick) { clearInterval(tick); tick = null; } }
  var view = null;
  function show(html, tab, learn) {
    stopTick();
    /* Aufgeklappte Bereiche merken, bevor neu gezeichnet wird. */
    [].forEach.call(app.querySelectorAll("details[data-keep]"), function (d) { openState[d.dataset.keep] = d.open; });
    app.innerHTML = html;
    document.body.classList.toggle("learn", learn === true);
    document.body.classList.toggle("course", learn === "course");
    tabs.hidden = !tab;
    [].forEach.call(tabs.children, function (b) { b.classList.toggle("on", b.dataset.t === tab); });
    [].forEach.call(tabs.children, function (b) { if (b.dataset.t === tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    window.scrollTo(0, 0);
    /* Bildschirmleser: Fokus auf die Überschrift bzw. Frage des neuen Bildschirms setzen. */
    var head = app.querySelector("h1, .q");
    if (head) { head.setAttribute("tabindex", "-1"); try { head.focus({ preventScroll: true }); } catch (e) {} }
  }
  /* Kurze Ansage für Bildschirmleser (unsichtbar). */
  var sr = document.getElementById("sr");
  ui.say = function (t) { if (!sr) return; sr.textContent = ""; setTimeout(function () { sr.textContent = t; }, 50); };
  ui.reduced = function () { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; };
  function bar(p, label) { p = Math.round(Math.max(0, Math.min(100, p))); return '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"' + (label ? ' aria-label="' + esc(label) + '"' : "") + '><i style="width:' + p + '%"></i></div>'; }
  function btn(act, label, o) {
    o = o || {};
    var d = "";
    for (var k in (o.data || {})) d += " data-" + k + '="' + esc(o.data[k]) + '"';
    return '<button class="btn' + (o.primary ? " primary" : "") + '" data-act="' + act + '"' + d + (o.off ? " disabled" : "") + ">" + esc(label) + (o.sub ? "<small>" + esc(o.sub) + "</small>" : "") + "</button>";
  }
  /* Meldungen nacheinander statt übereinander. Bei vielen auf einmal wird jede kürzer gezeigt (höchstens 6 in der Schlange). */
  var tq = [], tBusy = false;
  function toast(t) { if (tq.length < 6) tq.push(t); if (!tBusy) nextToast(); }
  function nextToast() {
    var t = tq.shift(); if (!t) { tBusy = false; return; }
    tBusy = true;
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = "<b>" + esc(t.title) + "</b>" + (t.sub ? esc(t.sub) : "");
    toastEl.appendChild(el);
    setTimeout(function () { el.remove(); nextToast(); }, tq.length > 2 ? 1500 : 2400);
  }
  WF.on("toast", toast);

  ui.H = H; ui.show = show; ui.btn = btn; ui.bar = bar; ui.toast = toast; ui.row = function () { return row.apply(null, arguments); };
  ui.prefSeg = function () { return prefSeg.apply(null, arguments); }; ui.start = function (id, c, s) { start(id, c, s); };
  ui.refresh = function () { if (view) view(); };
  ui.setView = function (f) { view = f; };

  /* Gemeinsame Bausteine: Schwierigkeit und Rubrik sind überall gleich bedienbar. */
  var DIFFS = [["auto", "Auto"], ["1", "Leicht"], ["2", "Mittel"], ["3", "Schwer"]];
  ui.diffSeg = function () {
    var d = S().settings.difficulty;
    return '<div class="cfg"><label>Schwierigkeit</label><div class="seg" role="group" aria-label="Schwierigkeit">' + DIFFS.map(function (o) { return '<button aria-pressed="' + (d === o[0]) + '" class="' + (d === o[0] ? "on" : "") + '" data-act="diff" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>" +
      '<p class="small mute" style="margin:-4px 0 0">' + (d === "auto" ? "Passt sich je Bereich an dein Können an." : "Bevorzugt Fragen dieser Stufe.") + "</p></div>";
  };
  ui.rubrikSel = function () {
    var cur = S().settings.playC || "";
    return '<div class="cfg"><label>Rubrik</label><select id="rub" class="inp"><option value="">Alle Themen</option>' + D.topics.map(function (t) { return '<option value="' + esc(t.c) + '"' + (t.c === cur ? " selected" : "") + ">" + esc(t.c) + "</option>"; }).join("") + "</select></div>";
  };
  ui.playC = function () { return S().settings.playC || null; };
  app.addEventListener("change", function (e) { if (e.target.id === "rub") { S().settings.playC = e.target.value; WF.store.save(); if (view === home) home(); } });
  /* Eingabefelder mit data-input="name" rufen H[name](feld) bei jeder Eingabe auf (z. B. Suche). */
  app.addEventListener("input", function (e) { var f = e.target.dataset && H[e.target.dataset.input]; if (f) f(e.target); });
  /* Aufgeklappte Bereiche (details mit data-keep) bleiben nach dem Neuzeichnen offen; show() liest den Zustand vorher aus. */
  ui.keepOpen = function (k) {
    var d = app.querySelector('details[data-keep="' + k + '"]');
    if (d) openState[k] = d.open;
    return openState[k] ? " open" : "";
  };
  function prefSeg(label, key, opts) {
    var cur = S().settings[key];
    return '<div class="cfg"><label>' + label + '</label><div class="seg" role="group" aria-label="' + esc(label) + '" style="grid-template-columns:repeat(3,1fr)">' + opts.map(function (o) { return '<button aria-pressed="' + (cur === o[0]) + '" class="' + (cur === o[0] ? "on" : "") + '" data-act="pref" data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div></div>";
  }
  ui.applyPrefs = function () {
    var st = S().settings, r = document.documentElement;
    if (st.theme === "light" || st.theme === "dark") r.setAttribute("data-theme", st.theme); else r.removeAttribute("data-theme");
    r.style.setProperty("--fs", { s: .92, m: 1, l: 1.12 }[st.font] || 1);
  };
  H.pref = function (d) { S().settings[d.k] = d.v; WF.store.save(); ui.applyPrefs(); profile(); };
  /* Farbe je Thema (gleiche Reihenfolge wie die Kacheln auf der Startseite) */
  var PAL = ["#2f5bea", "#e8590c", "#7a4bf0", "#d6336c", "#0c8599", "#2b8a3e", "#c2410c", "#4c6ef5"];
  ui.topicColor = function (c) { for (var i = 0; i < D.topics.length; i++) if (D.topics[i].c === c) return PAL[i % PAL.length]; return PAL[0]; };
  function ring(pct, col, label) {
    return '<span class="ring" style="--p:' + (pct > 0 ? Math.max(pct, 3) : 0) + ";--c:" + col + '" aria-hidden="true"><b>' + label + "</b></span>";
  }
  ui.ring = ring;
  /* „Was kann ich schon?“: je Thema ein Ring (Anteil gemeistert), darunter gesehen und Trefferquote. */
  function knowledgeMap() {
    var worst = null, totN = 0, totM = 0, totS = 0, tiles = "";
    D.topics.forEach(function (t) {
      var n = E.totalIn(t.c), k = E.knownIn(t.c), p = E.levelPct(t.c), a = E.accIn(t.c);
      totN += n; totM += p * n; totS += k;
      tiles += '<button class="kt" data-act="scope" data-c="' + esc(t.c) + '" data-s="">' + ring(p, ui.topicColor(t.c), E.fmtPct(p) + "%") + '<span class="t">' + esc(t.c) + '</span><span class="small mute">' + k + " von " + n + " gewusst" + (a.t ? " · " + U.pct(a.r, a.t) + " % richtig" : "") + "</span></button>";
      t.subs.forEach(function (sb) { var sa = E.accIn(t.c, sb); if (sa.t >= 5 && (!worst || U.pct(sa.r, sa.t) < worst.p)) worst = { c: t.c, n: sb, p: U.pct(sa.r, sa.t) }; });
    });
    var tp = totN ? totM / totN : 0;
    var h = '<div class="card ksum">' + ring(tp, "var(--play)", E.fmtPct(tp) + "%") + '<div class="grow"><b>Wissensstand ' + E.fmtPct(tp) + ' %</b><p class="small mute" style="margin:2px 0 0">' + totS + " von " + totN + " Fragen gewusst. Jede richtige Antwort füllt den Ring, Wiederholen nach Tagen füllt ihn ganz.</p></div></div>";
    h += '<div class="ktiles">' + tiles + "</div>";
    if (worst) h += '<div class="card note" style="margin-top:12px"><b>Schwächster Bereich: ' + esc(worst.n) + '</b><p class="small mute">' + worst.p + " % richtig</p>" + btn("start", "Gezielt üben", { primary: true, data: { m: "learn", c: worst.c, s: worst.n } }) + "</div>";
    return h;
  }
  H.diff = function (d) { S().settings.difficulty = d.v; WF.store.save(); if (view) view(); };
  ui.loading = function () { app.innerHTML = '<div class="center mute">Lädt …</div>'; tabs.hidden = true; };
  ui.failed = function (m) { app.innerHTML = '<div class="center"><p>Die Fragen konnten nicht geladen werden.</p><p class="mute small">' + esc(m) + '</p>' + btn("boot", "Nochmal versuchen") + "</div>"; };
  H.boot = function () { WF.boot(); };

  ui.views = ui.views || {};
  ui.go = function (name, a, b) { (({ home: home, areas: areas, profile: profile, scope: scope })[name] || ui.views[name])(a, b); };
  tabs.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) ui.go(b.dataset.t); });
  app.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]");
    if (!t || t.disabled) return;
    var f = H[t.dataset.act];
    if (f) f(t.dataset, t);
  });

  function start(id, c, s) {
    if (!E.start(id, { c: c || null, s: s || null })) { toast({ title: "Keine passenden Fragen", sub: id === "missed" ? "Hier gibt es noch keine Fehler." : "" }); return; }
    quiz();
  }
  H.start = function (d) { start(d.m, d.c, d.s); };

  /* ---------- Spielen (Startseite, blau) ---------- */
  function pills() {
    var st = S(), L = E.levelOf(st.xp), strk = E.curStreak(), today = st.days[U.today()] || 0;
    return '<div class="pills"><span class="pill">Level ' + L + " · " + E.titleOf(L) + '</span><span class="pill">Serie ' + strk + '</span><span class="pill">Heute ' + Math.min(today, E.consts.GOAL) + " / " + E.consts.GOAL + "</span></div>";
  }
  function row(act, ico, title, sub, data, off) {
    var d = ""; for (var k in (data || {})) d += " data-" + k + '="' + esc(data[k]) + '"';
    return '<button class="item' + (off ? " off" : "") + '" data-act="' + act + '"' + d + (off ? " disabled" : "") + '><span class="ico" aria-hidden="true">' + ico + '</span><div class="grow"><div class="t">' + esc(title) + '</div><div class="small mute">' + esc(sub) + '</div></div><span class="chev" aria-hidden="true">›</span></button>';
  }
  function home() {
    view = home;
    var st = S(), done = st.dailyDone[U.today()];
    var h = "<h1>Spielen</h1>" + pills();
    var dtxt = !done ? "5 Fragen aus 5 Themen, für alle gleich." : (done.n && done.n < E.consts.DAILY_N ? "Heute abgebrochen nach " + done.n + (done.n === 1 ? " Frage, " : " Fragen, ") + done.s + " richtig." : "Heute gelöst: " + done.s + " von " + E.consts.DAILY_N + ".") + " Morgen gibt es ein neues.";
    h += '<div class="hero"><h3>Tagesrätsel</h3><p>' + dtxt + "</p>" + btn("start", done ? "Erledigt" : "Jetzt spielen", { off: !!done, data: { m: "daily" } }) + "</div>";
    var dl = { auto: "Auto", 1: "Leicht", 2: "Mittel", 3: "Schwer" }[st.settings.difficulty];
    h += '<details class="card cfgbox" data-keep="homecfg"' + ui.keepOpen("homecfg") + '><summary><span class="mute small">Spielt mit</span><b>' + esc(st.settings.playC || "Alle Themen") + " · " + dl + "</b></summary>" +
      '<div class="cfgin">' + ui.rubrikSel() + ui.diffSeg().replace('class="cfg"', 'class="cfg" style="margin:0"') + "</div></details>";
    var ctx = { st: st };
    h += WF.slot("home", ctx, undefined, 10);
    h += '<h2>Allein spielen</h2><div class="tiles">' + WF.slot("home", ctx, 10, 40) + "</div>";
    var fr = WF.slot("home", ctx, 40);
    if (fr) h += '<h2>Mit Freunden</h2><div class="tiles">' + fr + "</div>";
    show(h, "home", false);
  }
  H.play = function (d) { start(d.m, ui.playC(), null); };

  /* ---------- Lernen (orange) ---------- */
  function areas() {
    view = areas;
    var st = S(), last = st.settings.last;
    var h = '<span class="mode-tag">Lernmodus</span><h1 style="margin-top:10px">Lernen</h1><p class="mute">Ohne Zeitdruck. Falsche Antworten kommen wieder, bis sie sitzen.</p>';
    h += '<div class="hero"><h3>' + (last ? esc(last.s || last.c) : "Alle Themen") + "</h3><p>" + (last ? "Dort machst du weiter." : "Du lernst, was noch nicht sitzt.") + "</p>" + btn("start", last ? "Weiterlernen" : "Loslegen", { data: { m: "learn", c: last ? last.c || "" : "", s: last ? last.s || "" : "" } }) + "</div>";
    h += WF.slot("areas", { st: st });
    h += '<div class="card cfg" style="margin:12px 0">' + ui.diffSeg().replace('class="cfg"', 'class="cfg" style="margin:0"') + "</div>";
    h += "<h2>Themen</h2>";
    D.topics.forEach(function (t) { h += progressItem(t.c, null, t.c, t.subs.length + " Bereiche"); });
    show(h, "areas", true);
  }
  function progressItem(c, s, title, sub) {
    var n = E.totalIn(c, s), k = E.knownIn(c, s), p = E.levelPct(c, s);
    return '<button class="item" data-act="scope" data-c="' + esc(c) + '" data-s="' + esc(s || "") + '">' + (n ? ring(p, ui.topicColor(c), E.fmtPct(p) + "%") : "") + '<div class="grow"><div class="t">' + esc(title) + '</div><div class="small mute">' + esc(sub || "") + (n ? (sub ? " · " : "") + k + " von " + n + " gewusst" : "") + '</div></div><span class="chev" aria-hidden="true">›</span></button>';
  }
  function scope(c, s) {
    s = s || null;
    view = function () { scope(c, s); };
    var n = E.totalIn(c, s), k = E.knownIn(c, s), lp = E.levelPct(c, s), acc = E.accIn(c, s), d = { c: c, s: s || "" };
    function dm(id) { return { m: id, c: d.c, s: d.s }; }
    var h = '<button class="ghost" data-act="' + (s ? "scope" : "areas") + '" data-c="' + esc(c) + '" data-s="">‹ Zurück</button>';
    h += "<h1>" + esc(s || c) + "</h1>";
    if (n) h += '<div class="card ksum">' + ring(lp, ui.topicColor(c), E.fmtPct(lp) + "%") + '<div class="grow"><b>Wissensstand ' + E.fmtPct(lp) + ' %</b><p class="small mute" style="margin:2px 0 0">' + (s ? esc(c) + " · " : "") + k + " von " + n + " gewusst" + (acc.t ? " · " + U.pct(acc.r, acc.t) + " % richtig" : "") + "</p></div></div>";
    else h += '<p class="mute">' + (s ? esc(c) + " · " : "") + "Zufällig erzeugte Aufgaben</p>";
    h += '<div class="hero" style="margin-top:16px"><h3>Lernen</h3><p>Erst, was noch nicht sitzt.</p>' + btn("start", "Lernrunde starten", { data: dm("learn") }) + "</div>";
    h += WF.slot("scope", { c: c, s: s, n: n });
    h += '<div class="card cfg" style="margin:12px 0">' + ui.diffSeg().replace('class="cfg"', 'class="cfg" style="margin:0"') + "</div>";
    h += '<div class="playc"><h2>In diesem Bereich spielen</h2><div class="grid2">' + btn("start", "Test", { sub: "10 Fragen", data: dm("classic") }) + btn("start", "Blitz", { sub: "60 Sekunden", data: dm("blitz") }) + "</div>" + '<div style="margin-top:10px">' + btn("start", "Überleben", { sub: "3 Leben", data: dm("survive") }) + "</div></div>";
    if (!s) {
      h += "<h2>Bereiche</h2>";
      D.subsOf(c).forEach(function (x) { h += progressItem(c, x, x, ""); });
    }
    show(h, "areas", true);
  }
  H.areas = function () { areas(); };
  H.scope = function (d) { scope(d.c, d.s || null); };

  /* ---------- Quiz ---------- */
  function dots(d) { return '<span aria-hidden="true">' + "●".repeat(d) + "○".repeat(3 - d) + '</span><span class="sr-only">Schwierigkeit ' + ["leicht", "mittel", "schwer"][d - 1] + "</span>"; }
  function livesLabel(s) { return s.lives + " von " + s.m.lives + " Leben"; }
  function quiz() {
    var s = E.s, m = s.m, x = E.cur(), info, prog = "";
    if (m.lives) { var hs = ""; for (var i = 0; i < m.lives; i++) hs += i < s.lives ? "♥" : "♡"; info = '<span class="chip lives" id="lv" role="img" aria-label="' + livesLabel(s) + '">' + hs + "</span>"; }
    else if (m.timer) { info = '<span class="chip" id="tm" role="timer" aria-live="off">' + Math.ceil(E.timeLeft()) + " s</span>"; prog = '<div class="bar" aria-hidden="true"><i id="tb" style="width:' + (E.timeLeft() / m.timer * 100) + '%"></i></div>'; }
    else { info = '<span class="chip">' + (s.idx + 1) + " / " + s.round.length + "</span>"; prog = bar(s.idx / s.round.length * 100, "Fortschritt der Runde"); }
    if (!m.learn && !m.timer) prog += '<div class="qtime" id="qt" aria-hidden="true"><i></i></div>';
    var h = '<div class="topbar"><button class="ghost" data-act="quit">✕ Beenden</button>' + (m.learn ? '<span class="mode-tag">Lernen</span>' : "") + (s.streak > 1 ? '<span class="chip combo" id="combo">' + comboTxt(s.streak) + "</span>" : '<span class="chip combo" id="combo" hidden></span>') + info + "</div>" + prog;
    h += '<div class="qmeta">' + esc(x.c) + " · " + esc(x.s) + " · " + dots(x.d || 2) + (x.retry ? " · Wiederholung" : "") + "</div>";
    h += '<p class="q">' + esc(x.q) + "</p>";
    /* Ein Feature kann den Antwortbereich ersetzen (z. B. freie Eingabe, typein.js). */
    var custom = WF.answerArea ? WF.answerArea(x, s) : null;
    if (m.helps !== "none") {
      var lim = m.helps === "limited";
      h += '<div class="helps-label">Hilfen</div><div class="helps">' + (custom ? "" : '<button data-act="fifty"' + (E.canHelp("fifty") ? "" : " disabled") + ">50:50" + (lim ? " (" + s.jokers.fifty + ")" : "") + "</button>") + '<button data-act="hint"' + (E.canHelp("hint") ? "" : " disabled") + ">Hinweis" + (lim ? " (" + s.jokers.hint + ")" : "") + "</button></div>";
      if (x.hintShown) h += '<div class="hint">' + esc(x.h) + "</div>";
    }
    if (custom) h += custom;
    else {
      h += '<div id="opts" role="group" aria-label="Antworten">';
      x.opts.forEach(function (o, i) {
        var gone = x.hidden.indexOf(i) >= 0;
        h += '<button class="ans' + (gone ? " gone" : "") + '" data-act="pick" data-i="' + i + '"' + (gone ? " disabled" : "") + ">" + esc(o.t) + "</button>";
      });
      h += "</div>";
    }
    h += '<div id="fb" aria-live="polite"></div>';
    show(h, null, !!m.learn);
    if (m.timer) tick = setInterval(function () {
      var t = E.timeLeft(), tm = document.getElementById("tm"), tb = document.getElementById("tb");
      if (tm) tm.textContent = Math.ceil(t) + " s";
      if (tb) tb.style.width = (t / m.timer * 100) + "%";
      if (t <= 0) { stopTick(); E.finish(); result(); }
    }, 200);
  }
  H.fifty = function () { if (E.useFifty()) quiz(); };
  H.hint = function () { if (E.useHint()) quiz(); };
  H.pick = function (d) { var r = E.answer(+d.i); if (r) paint(r); };

  ui.paint = function (r) { paint(r); };
  ui.refreshQuiz = function () { quiz(); };
  function comboTxt(n) { var m = E.mult(n); return "🔥 " + n + (m > 1 ? " · ×" + m : ""); }
  ui.comboTxt = comboTxt;
  function paint(r) {
    var s = E.s, x = r.x, btns = app.querySelectorAll(".ans");
    x.opts.forEach(function (o, i) {
      var b = btns[i];
      if (!b) return;
      b.disabled = true;
      if (b.classList.contains("gone")) return;
      if (o.ok) b.classList.add("ok"); else if (i === r.picked) b.classList.add("bad"); else b.classList.add("dim");
      if (o.ok || i === r.picked) b.setAttribute("aria-label", o.t + (o.ok ? (i === r.picked ? ", deine Antwort, richtig" : ", richtige Antwort") : ", deine Antwort, falsch"));
    });
    ui.say(r.ok ? "Richtig." : "Falsch. Richtig ist: " + x.opts.filter(function (o) { return o.ok; })[0].t);
    var hp = app.querySelector(".helps"); if (hp) hp.remove();
    var hl = app.querySelector(".helps-label"); if (hl) hl.remove();
    var lv = document.getElementById("lv");
    if (lv) { var hs = ""; for (var i = 0; i < s.m.lives; i++) hs += i < s.lives ? "♥" : "♡"; lv.textContent = hs; lv.setAttribute("aria-label", livesLabel(s)); }
    /* Spielgefühl: Animation, fliegende Punkte, Combo-Anzeige, Zeitbalken anhalten */
    var qt = document.getElementById("qt"); if (qt) qt.classList.add("stop");
    var cb = document.getElementById("combo");
    if (cb) { if (r.ok && s.streak > 1) { cb.hidden = false; cb.textContent = comboTxt(s.streak); cb.classList.remove("bump"); void cb.offsetWidth; cb.classList.add("bump"); } else if (!r.ok) cb.hidden = true; }
    var pb = r.picked >= 0 ? btns[r.picked] : null;
    if (pb && !ui.reduced()) { pb.classList.add(r.ok ? "pop" : "shake"); if (r.ok && r.gain) { var fl = document.createElement("span"); fl.className = "floatxp"; fl.textContent = "+" + r.gain; pb.appendChild(fl); } }
    if (s.m.auto) { s.adv = setTimeout(next, r.ok ? 450 : 1300); return; }
    var auto = r.ok && S().settings.autoNext !== "stay";
    var right = x.opts.filter(function (o) { return o.ok; })[0], picked = r.picked >= 0 ? x.opts[r.picked] : r.given;
    var f = '<div class="fb ' + (r.ok ? "ok" : "bad") + '"><b class="h">' + (r.ok ? "Richtig" + (r.gain ? " · +" + r.gain + " XP" : "") + (r.mult > 1 ? ' <span class="multi">×' + r.mult + "</span>" : "") : "Nicht ganz") + "</b>";
    if (r.slow) f += '<p class="small">Länger überlegt? Die Frage kommt bald wieder, bis sie sitzt.</p>';
    if (auto) f += '<button class="link small" data-act="fbmore">Erklärung ansehen</button><div class="fbmore" hidden>';
    if (!r.ok) {
      f += "<p>Richtig: <b>" + esc(right.t) + "</b></p>";
      if (r.typed) f += '<p class="small">Deine Eingabe: „' + esc(picked.t) + '“</p>';
      if (picked.why) f += "<p><b>Warum nicht „" + esc(picked.t) + "“?</b> " + esc(picked.why) + "</p>";
    }
    if (x.e) f += "<p>" + esc(x.e) + "</p>";
    if (x.src) f += '<p class="small mute">Quelle: ' + esc(x.src) + "</p>";
    f += '<p class="small" style="margin-top:8px;display:flex;gap:16px"><button class="link" data-act="save">' + (S().saved[x.id] ? "★ Gemerkt" : "☆ Merken") + '</button><button class="link" data-act="report">Frage melden</button></p>';
    if (r.mastered) f += '<p class="small"><b>Gemeistert.</b> Das sitzt jetzt.</p>';
    if (r.requeued) f += '<p class="small">Die Frage kommt gleich noch einmal.</p>';
    var others = x.opts.filter(function (o, i) { return o.why && i !== r.picked && !o.ok; });
    if (others.length) {
      f += "<details><summary>Die anderen Antworten</summary><ul>";
      others.forEach(function (o) { f += "<li><b>" + esc(o.t) + ":</b> " + esc(o.why) + "</li>"; });
      f += "</ul></details>";
    }
    if (auto) f += "</div>";
    f += "</div>" + btn("next", r.last ? "Ergebnis ansehen" : "Weiter", { primary: true });
    var box = document.getElementById("fb");
    box.innerHTML = f;
    box.scrollIntoView({ behavior: ui.reduced() ? "auto" : "smooth", block: "nearest" });
    var nb = box.querySelector('[data-act="next"]'); if (nb) try { nb.focus({ preventScroll: true }); } catch (e) {}
    if (auto && nb) {
      nb.classList.add("autobar"); nb.insertAdjacentHTML("beforeend", '<i aria-hidden="true"></i>');
      s.adv = setTimeout(next, 1800);
      box.addEventListener("click", function (ev) { if (!ev.target.closest('[data-act="next"]')) { E.clearAdv(); nb.classList.remove("autobar"); } });
    }
  }
  H.fbmore = function (d, t) { E.clearAdv(); var m = app.querySelector(".fbmore"); if (m) m.hidden = false; t.remove(); var nb = app.querySelector(".autobar"); if (nb) nb.classList.remove("autobar"); };
  H.save = function (d, t) {
    var x = E.cur(), sv = S().saved;
    if (sv[x.id]) { delete sv[x.id]; t.textContent = "☆ Merken"; } else { sv[x.id] = 1; t.textContent = "★ Gemerkt"; }
    WF.store.save();
  };
  /* H.report steht in reports.js */
  function next() { if (!E.s) return; E.next() === "result" ? result() : quiz(); }
  H.next = next;
  H.quit = function () {
    var s = E.s;
    E.clearAdv();
    if (s.score + s.wrong.length === 0) { s.over = true; home(); return; }
    E.finish(); result();
  };

  /* ---------- Ergebnis ---------- */
  function result() {
    view = null;
    var s = E.s, m = s.m, n = s.score + s.wrong.length;
    var h = '<h1>' + esc(m.title) + (s.scope.s || s.scope.c ? " · " + esc(s.scope.s || s.scope.c) : "") + "</h1>";
    h += '<div class="score">' + (m.timer || m.lives ? s.score + " richtig" : s.score + " von " + n) + "</div>";
    h += '<p class="mute">+' + s.roundXP + " XP · beste Serie " + s.best + (s.record ? " · neuer Rekord" : "") + (s.mastNew ? " · " + s.mastNew + " neu gemeistert" : "") + "</p>";
    h += WF.slot("result", { s: s });
    s.newBadges.forEach(function (b) { h += '<div class="card"><b>Abzeichen: ' + esc(b.n) + "</b><br><span class=\"small mute\">" + esc(b.d) + "</span></div>"; });
    h += '<div style="margin:16px 0">' + (m.daily ? btn("home", "Fertig", { primary: true }) : btn("again", "Nochmal", { primary: true }) + '<div style="height:8px"></div>' + btn("home", "Zur Startseite")) + "</div>";
    if (s.wrong.length) {
      h += "<h2>Das kannst du noch mitnehmen</h2>" + '<div class="card">';
      s.wrong.forEach(function (w) {
        h += '<div class="wrong"><b>' + esc(w.q) + "</b><br>Richtig: " + esc(w.right) + '<br><span class="mute">Deine Antwort: ' + esc(w.given) + (w.why ? " – " + esc(w.why) : "") + "</span>" + (w.e ? "<br>" + esc(w.e) : "") + "</div>";
      });
      h += "</div>";
    }
    show(h, null, !!m.learn);
  }
  H.home = function () { home(); };
  H.again = function () { var s = E.s; start(s.m.id, s.scope.c, s.scope.s); };

  /* ---------- Profil ---------- */
  function profile() {
    view = profile;
    var st = S(), L = E.levelOf(st.xp), a = E.lvlStart(L), b = E.lvlStart(L + 1), t = st.tot, diff = st.settings.difficulty;
    var h = "<h1>Profil</h1>" + '<div class="card"><div class="row sb"><div><b>Level ' + L + "</b> · " + E.titleOf(L) + '</div><div class="small mute">' + st.xp + " XP</div></div>" + '<div style="margin-top:10px">' + bar(U.pct(st.xp - a, b - a)) + "</div></div>";
    h += '<div class="stats"><div class="stat"><b>' + t.r + "</b><span>richtig</span></div><div class=\"stat\"><b>" + U.pct(t.r, t.t) + " %</b><span>Trefferquote</span></div><div class=\"stat\"><b>" + st.streak.best + "</b><span>beste Serie (Tage)</span></div></div>";
    h += WF.slot("profiletop", { st: st });
    h += "<h2>Was kann ich schon?</h2>" + knowledgeMap();
    h += WF.slot("profile", { st: st });
    h += "<h2>Einstellungen</h2>" + '<div class="card">' + ui.diffSeg() + prefSeg("Schrift", "font", [["s", "Klein"], ["m", "Normal"], ["l", "Groß"]]) + prefSeg("Darstellung", "theme", [["auto", "Auto"], ["light", "Hell"], ["dark", "Dunkel"]]) + WF.slot("settings") + "</div>";
    h += "<h2>Abzeichen · " + Object.keys(st.badges).length + " / " + WF.badges.length + "</h2>" + '<div class="badges">';
    WF.badges.forEach(function (b) { h += '<div class="badge' + (st.badges[b.id] ? "" : " off") + '"><b>' + esc(b.n) + "</b><span>" + esc(b.d) + "</span></div>"; });
    h += "</div><h2>Fortschritt sichern</h2>" + '<div class="card"><p class="small mute">Der Fortschritt liegt nur auf diesem Gerät. Mit dem Code ziehst du ihn auf ein anderes Gerät um.</p>';
    h += '<div class="grid2">' + btn("exp", "Code erzeugen") + btn("copy", "Kopieren") + '</div><textarea id="code" placeholder="Hier erscheint dein Code oder füge einen Code ein" spellcheck="false" autocapitalize="off"></textarea>' + btn("imp", "Code laden") + "</div>";
    h += "<h2>Zurücksetzen</h2>" + '<div id="rs">' + btn("reset1", "Fortschritt löschen") + "</div>";
    show(h, "profile");
  }
  H.exp = function () { document.getElementById("code").value = WF.store.exportCode(); };
  H.copy = function () {
    var ta = document.getElementById("code");
    if (!ta.value) ta.value = WF.store.exportCode();
    ta.select();
    try { navigator.clipboard.writeText(ta.value).then(function () { toast({ title: "Kopiert" }); }, function () { toast({ title: "Zum Kopieren Text markieren" }); }); } catch (e) { toast({ title: "Zum Kopieren Text markieren" }); }
  };
  H.imp = function () {
    if (WF.store.importCode(document.getElementById("code").value)) { toast({ title: "Fortschritt geladen" }); home(); }
    else toast({ title: "Code ungültig", sub: "Er muss mit WF1: beginnen." });
  };
  H.reset1 = function () { document.getElementById("rs").innerHTML = '<p class="small mute">Wirklich alles löschen? Das lässt sich nicht rückgängig machen.</p><div class="grid2">' + btn("reset2", "Ja, löschen") + btn("profile", "Abbrechen") + "</div>"; };
  H.reset2 = function () { WF.store.reset(); toast({ title: "Zurückgesetzt" }); home(); };
  H.profile = function () { profile(); };
})();
