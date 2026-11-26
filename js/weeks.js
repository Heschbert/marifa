/* Themenwoche: jede Kalenderwoche (Mo–So) steht ein Thema im Mittelpunkt, für alle gleich.
   Ziel: 40 richtige Antworten in diesem Thema in der Woche. Belohnung: +150 XP und Fortschritt bei den Abzeichen.
   Zustand: st.weeks[Wochenschlüssel] = { r: richtige Antworten, done: Datum }. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var GOAL = 40, BONUS = 150;
  function monday(d) { var m = new Date(d.getFullYear(), d.getMonth(), d.getDate()); m.setDate(m.getDate() - (m.getDay() + 6) % 7); return m; }
  function current() {
    var mo = monday(new Date()), key = U.dkey(mo);
    var idx = Math.floor(Date.UTC(mo.getFullYear(), mo.getMonth(), mo.getDate()) / 864e5 / 7);
    var cats = D.topics.map(function (t) { return t.c; });
    var left = 7 - (new Date().getDay() + 6) % 7;
    return { key: key, c: cats[idx % cats.length], left: left };
  }
  function rec(w) { var all = S().weeks || (S().weeks = {}); return all[w.key] || (all[w.key] = { r: 0, done: "" }); }
  WF.on("answered", function (r) {
    if (!r.ok || !r.x || r.x.retry || r.estimate || r.timeline || r.course) return;
    var w = current(); if (r.x.c !== w.c) return;
    var s = rec(w); if (s.done) return;
    s.r++;
    if (s.r >= GOAL) {
      s.done = U.today(); E.addXP(BONUS);
      WF.emit("celebrate", { icon: "★", kind: "badge", title: "Themenwoche geschafft", sub: GOAL + " richtige in " + w.c + ". +" + BONUS + " XP." });
    }
  });
  H.weekgo = function (d) { ui.startWith("classic", { c: d.c, s: null }); };
  WF.weekCount = function () { var all = S().weeks || {}; return Object.keys(all).filter(function (k) { return all[k].done; }).length; };
  WF.registerEntry({ where: "today", order: 3, render: function () {
    var w = current(), s = rec(w);
    if (s.done) return '<div class="trow"><span class="tic ok">★</span><span class="grow"><b>Themenwoche: ' + esc(w.c) + '</b><span class="small mute">geschafft · nächste Woche neues Thema</span></span></div>';
    return '<button class="trow" data-act="weekgo" data-c="' + esc(w.c) + '"><span class="tic">★</span><span class="grow"><b>Woche: ' + esc(w.c) + '</b><span class="small mute">' + Math.min(s.r, GOAL) + " / " + GOAL + " richtig · noch " + w.left + (w.left === 1 ? " Tag" : " Tage") + '</span></span><span class="tgo">Spielen</span></button>';
  } });
})();
