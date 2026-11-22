/* Abzeichen: reagieren auf Ereignisse der Engine. Neue Abzeichen werden einfach in die Liste eingetragen. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data;
  function S() { return WF.store.data; }

  var BADGES = WF.badges = [
    { id: "first",   n: "Erste Runde",       d: "Eine Runde beenden",             t: function (e) { return e; } },
    { id: "perfect", n: "Makellos",          d: "10 von 10 im Test",              t: function (e) { var s = E.s; return e && s.m.id === "classic" && s.round.length >= 10 && s.score === s.round.length; } },
    { id: "combo10", n: "Serienheld",        d: "10 richtige in Folge",           t: function () { return S().maxCombo >= 10; } },
    { id: "s3",      n: "Am Ball",           d: "3 Tage in Folge",                t: function () { return S().streak.n >= 3; } },
    { id: "s7",      n: "Wochenläufer",      d: "7 Tage in Folge",                t: function () { return S().streak.n >= 7; } },
    { id: "s30",     n: "Gewohnheitstier",   d: "30 Tage in Folge",               t: function () { return S().streak.n >= 30; } },
    { id: "r100",    n: "Hundert Treffer",   d: "100 richtige Antworten",         t: function () { return S().tot.r >= 100; } },
    { id: "r500",    n: "Fünfhundert",       d: "500 richtige Antworten",         t: function () { return S().tot.r >= 500; } },
    { id: "cats",    n: "Breit aufgestellt", d: "In allen Themen gespielt",       t: function () { return D.cats().every(function (c) { return S().cats[c] && S().cats[c].t > 0; }); } },
    { id: "blitz15", n: "Blitzmerker",       d: "15 richtige im Blitz",           t: function (e) { var s = E.s; return e && s.m.id === "blitz" && s.score >= 15; } },
    { id: "surv20",  n: "Zäh",               d: "20 richtige im Überleben",       t: function (e) { var s = E.s; return e && s.m.id === "survive" && s.score >= 20; } },
    { id: "lvl5",    n: "Kenner",            d: "Level 5 erreichen",              t: function () { return E.levelOf(S().xp) >= 5; } },
    { id: "daily5",  n: "Stammgast",         d: "5 Tagesrätsel lösen",            t: function () { var dd = S().dailyDone; return Object.keys(dd).filter(function (k) { return !dd[k].n || dd[k].n >= E.consts.DAILY_N; }).length >= 5; } },
    { id: "m25",     n: "Fundament",         d: "25 Fragen gemeistert",           t: function () { return E.masteredIn() >= 25; } },
    { id: "m100",    n: "Mauerwerk",         d: "100 Fragen gemeistert",          t: function () { return E.masteredIn() >= 100; } },
    { id: "geo50",   n: "Weltenbummler",     d: "50 Geographie-Fragen gemeistert", t: function () { return E.masteredIn("Geographie") >= 50; } },
    { id: "math50",  n: "Rechenkünstler",    d: "50 Kopfrechenaufgaben richtig",  t: function () { var s = S().sub["Mathematik|Kopfrechnen"]; return !!s && s.r >= 50; } },
    { id: "spec",    n: "Spezialist",        d: "Einen Unterbereich komplett gemeistert", t: function () {
        return D.topics.some(function (t) { return t.subs.some(function (s) { var n = E.totalIn(t.c, s); return n > 0 && E.masteredIn(t.c, s) === n; }); }); } },
    { id: "help0",   n: "Ohne Hilfe",        d: "Test mit 8 von 10 ohne Hilfen", t: function (e) { var s = E.s; return e && s.m.id === "classic" && s.score >= 8 && !s.round.some(function (x) { return x.helped; }); } }
  ];

  function check(e) {
    BADGES.forEach(function (b) {
      if (!S().badges[b.id] && b.t(!!e)) {
        S().badges[b.id] = Date.now();
        if (E.s) E.s.newBadges.push(b);
        WF.emit("celebrate", { icon: "🏅", kind: "badge", title: b.n, sub: "Neues Abzeichen · " + b.d });
      }
    });
  }
  WF.on("answered", function () { check(false); });
  WF.on("roundEnd", function () { check(true); });
})();
