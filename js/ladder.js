/* Wissensleiter: 15 Fragen, immer schwerer (5 leicht, 5 mittel, 5 schwer). Nach jeder richtigen Antwort:
   Punkte sichern und aufhören oder weiterspielen. Bei einem Fehler fällt man auf die letzte Sicherheitsstufe (5 und 10).
   Ein 50:50-Joker pro Spiel. Punkte werden zu XP (ein Zehntel). */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var PTS = [10, 20, 30, 50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000], SAFE = [4, 9];
  var L = null;

  function pick() {
    var c = S().settings.playC || null, out = [], used = {};
    [1, 2, 3].forEach(function (d) {
      var cand = D.real.filter(function (x) { return x.a && (x.d || 2) === d && (!c || x.c === c); });
      if (cand.length < 5) cand = D.real.filter(function (x) { return x.a && (x.d || 2) === d; });
      E.order(cand).forEach(function (x) { if (out.length < d * 5 && !used[x.id]) { used[x.id] = 1; out.push(E.prep(x)); } });
    });
    return out;
  }
  function safeBelow(i) { var s = -1; SAFE.forEach(function (k) { if (k < i) s = k; }); return s; }
  function ladderHtml() {
    var h = '<ol class="ladder" aria-label="Stufen">';
    for (var k = PTS.length - 1; k >= 0; k--) {
      var cls = (k === L.i ? " cur" : k < L.i ? " done" : "") + (SAFE.indexOf(k) >= 0 ? " safe" : "");
      h += '<li class="' + cls.trim() + '"><span>' + (k + 1) + "</span><b>" + PTS[k] + "</b></li>";
    }
    return h + "</ol>";
  }

  H.ladder = function () { L = { qs: pick(), i: 0, joker: 1, hidden: [] }; if (L.qs.length < 15) { ui.toast({ title: "Zu wenige Fragen" }); return; } q(); };
  function q() {
    var x = L.qs[L.i];
    var h = '<div class="topbar"><button class="ghost" data-act="lquit">✕ Beenden</button><span class="chip">Stufe ' + (L.i + 1) + " / 15 · " + PTS[L.i] + " Punkte</span></div>";
    h += '<details class="card ladbox"><summary class="small"><b>Leiter</b> · gesichert: ' + (L.i > 0 ? PTS[L.i - 1] : 0) + " · Sicherheit: " + (safeBelow(L.i) >= 0 ? PTS[safeBelow(L.i)] : 0) + "</summary>" + ladderHtml() + "</details>";
    h += '<div class="qmeta">' + esc(x.c) + " · " + "●".repeat(x.d) + "○".repeat(3 - x.d) + '</div><p class="q">' + WF.util.qh(x) + "</p>";
    if (L.joker) h += '<div class="helps"><button data-act="ljok">50:50-Joker (1)</button></div>';
    h += '<div id="opts" role="group" aria-label="Antworten">';
    x.opts.forEach(function (o, k) { var g = L.hidden.indexOf(k) >= 0; h += '<button class="ans' + (g ? " gone" : "") + '" data-act="lpick" data-i="' + k + '"' + (g ? " disabled" : "") + ">" + WF.util.ot(o.t) + "</button>"; });
    ui.show(h + '</div><div id="fb" aria-live="polite"></div>', null);
  }
  H.ljok = function () {
    var x = L.qs[L.i], w = []; x.opts.forEach(function (o, k) { if (!o.ok) w.push(k); });
    L.hidden = U.shuffle(w).slice(0, 2); L.joker = 0; q();
  };
  H.lpick = function (d) {
    if (L.answered) return; L.answered = true;
    var x = L.qs[L.i], k = +d.i, ok = x.opts[k].ok, btns = document.querySelectorAll("#opts .ans");
    x.opts.forEach(function (o, j) { btns[j].disabled = true; btns[j].classList.add(o.ok ? "ok" : j === k ? "bad" : "dim"); });
    if (!ui.reduced()) btns[k].classList.add(ok ? "pop" : "shake");
    WF.emit("answered", { ok: ok, gain: 0, x: { retry: false, c: x.c }, ladder: true });
    E.registerPlay();
    L.lastOk = ok; E.markSeen(x.id); WF.store.save();
    var right = x.opts.filter(function (o) { return o.ok; })[0], f;
    if (ok) {
      var last = L.i === 14, sv = SAFE.indexOf(L.i) >= 0;
      f = '<div class="fb ok"><b class="h">Richtig · ' + PTS[L.i] + " Punkte" + (sv ? " · Sicherheitsstufe erreicht" : "") + "</b>" + (x.e ? '<p class="small">' + esc(x.e) + "</p>" : "") + "</div>";
      f += last ? btn("lend", "Ganz oben! Abschließen", { primary: true, data: { p: PTS[14] } }) :
        '<div class="grid2">' + btn("lend", "Aufhören", { sub: PTS[L.i] + " Punkte sichern", data: { p: PTS[L.i], stopped: 1 } }) + btn("lnext", "Weiter", { primary: true, sub: "um " + PTS[L.i + 1] + " Punkte" }) + "</div>";
    } else {
      var s = safeBelow(L.i), keep = s >= 0 ? PTS[s] : 0; L.keep = keep;
      f = '<div class="fb bad"><b class="h">Leider falsch</b><p>Richtig: <b>' + WF.util.ot(right.t) + "</b></p>" + (x.e ? '<p class="small">' + esc(x.e) + "</p>" : "") + "<p>Du fällst zurück auf " + keep + " Punkte.</p></div>" + btn("lend", "Ergebnis", { primary: true, data: { p: keep } });
    }
    document.getElementById("fb").innerHTML = f;
  };
  H.lnext = function () { L.i++; L.hidden = []; L.answered = false; q(); };
  H.lquit = function () {
    if (L.i === 0 && !L.answered) return ui.go("home");
    H.lend({ p: L.answered ? (L.lastOk ? PTS[L.i] : L.keep || 0) : PTS[L.i - 1], stopped: L.answered ? (L.lastOk ? 1 : 0) : 1 });
  };
  H.lend = function (d) {
    var p = +d.p || 0, st = S(); st.best.ladder = st.best.ladder || 0;
    var rec = p > st.best.ladder; if (rec) st.best.ladder = p;
    var xp = Math.round(p / 10); if (xp) E.addXP(xp); WF.store.save();
    WF.emit("ladderEnd", { p: p });
    /* Erreichte Stufe: Anzahl richtig beantworteter Stufen */
    var top = L ? (L.answered && L.lastOk ? L.i + 1 : L.i) : 0, top15 = top >= 15;
    var msg = top15 ? "Ganz oben angekommen!" : p === 0 ? "Diesmal leider leer ausgegangen." : d.stopped ? "Klug aufgehört und gesichert." : "Auf die Sicherheitsstufe gefallen.";
    var lad = '<div class="lend-ladder" aria-hidden="true">';
    for (var k = 0; k < PTS.length; k++) lad += '<i class="' + (k < top ? "on" : "") + (SAFE.indexOf(k) >= 0 ? " safe" : "") + '" style="height:' + (14 + k * 4) + 'px"></i>';
    lad += "</div>";
    ui.show('<div class="lend">' + '<div class="lend-medal' + (top15 ? " gold" : p ? "" : " zero") + '"><b>' + p + "</b><span>Punkte</span></div>" +
      "<h1>" + esc(msg) + '</h1><p class="mute">Stufe ' + top + " von 15" + (st.best.ladder ? " · Rekord " + st.best.ladder : "") + "</p>" + lad +
      '<div class="lend-chips"><span class="chip">+' + xp + " XP</span>" + (rec ? '<span class="chip recchip">Neuer Rekord</span>' : "") + "</div></div>" +
      '<div class="nextbar">' + btn("ladder", "Nochmal", { primary: true }) + '<div style="height:8px"></div>' + btn("home", "Zur Startseite") + "</div>", null);
    if (rec && p > 0) WF.emit("celebrate", { icon: "⇧", kind: "record", title: "Neuer Rekord", sub: "Wissensleiter · " + p + " Punkte" });
  };
  WF.registerEntry({ where: "home", order: 25, render: function (c) {
    return ui.row("ladder", "⇧", "Wissensleiter", "15 Stufen, immer schwerer · aufhören oder alles riskieren" + (c.st.best.ladder ? " · Rekord " + c.st.best.ladder : ""), {});
  } });
})();
