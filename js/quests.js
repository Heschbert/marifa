/* Tagesaufgaben: jeden Tag drei kleine Aufgaben (für alle gleich ausgelost). Sind alle erledigt,
   lässt sich eine Truhe mit zufälliger Belohnung öffnen: XP oder Serienschutz. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }

  /* Aufgabentypen. t = Ziel, ev = wie Fortschritt entsteht. */
  var TYPES = [
    { id: "ans", t: 20, txt: function () { return "20 Fragen beantworten"; } },
    { id: "right", t: 15, txt: function () { return "15 Fragen richtig beantworten"; } },
    { id: "combo", t: 5, txt: function () { return "5 richtige Antworten in Folge"; } },
    { id: "combo8", t: 8, txt: function () { return "8 richtige Antworten in Folge"; } },
    { id: "topic", t: 5, txt: function (q) { return "5 richtige Antworten in " + q.c; } },
    { id: "daily", t: 1, txt: function () { return "Das Tagesrätsel spielen"; } },
    { id: "blitz", t: 10, txt: function () { return "Im Blitz 10 richtige in einer Runde"; } },
    { id: "learn", t: 1, txt: function () { return "Eine Lernrunde beenden"; } },
    { id: "est", t: 1, txt: function () { return "Eine Schätzrunde spielen"; } },
    { id: "tl", t: 1, txt: function () { return "Einen Zeitstrahl spielen"; } },
    { id: "ladder", t: 1, txt: function () { return "Die Wissensleiter spielen"; } }
  ];
  function today() {
    var st = S(), d = U.today();
    if (!st.quests || st.quests.day !== d) {
      var rng = U.mulberry(U.seedOf("quests" + d)), pool = U.shuffle(TYPES.slice(), rng), pick = [], ids = {};
      pool.forEach(function (t) { if (pick.length < 3 && !(t.id.indexOf("combo") === 0 && ids.combo)) { pick.push(t); if (t.id.indexOf("combo") === 0) ids.combo = 1; } });
      var cats = D.cats();
      st.quests = { day: d, chest: false, list: pick.map(function (t) { return { id: t.id, p: 0, t: t.t, c: t.id === "topic" ? cats[Math.floor(rng() * cats.length)] : null }; }) };
      WF.store.save();
    }
    return st.quests;
  }
  function typeOf(q) { return TYPES.filter(function (t) { return t.id === q.id; })[0]; }
  function bump(id, val, absolute, cat) {
    var Q = today(), changed = false;
    Q.list.forEach(function (q) {
      if (q.id !== id || q.p >= q.t || (q.c && cat !== q.c)) return;
      var n = absolute ? Math.max(q.p, val) : q.p + val;
      if (n !== q.p) { q.p = Math.min(q.t, n); changed = true; if (q.p >= q.t) WF.emit("toast", { title: "Aufgabe erledigt", sub: typeOf(q).txt(q) }); }
    });
    if (changed) { WF.store.save(); if (Q.list.every(function (q) { return q.p >= q.t; }) && !Q.chest) WF.emit("toast", { title: "Alle Tagesaufgaben erledigt", sub: "Die Truhe wartet auf der Startseite." }); }
  }
  WF.on("answered", function (r) {
    if (r.estimate) return;
    if (r.timeline || r.link || r.x.retry) return;
    bump("ans", 1);
    if (r.ok) { bump("right", 1); if (r.x && r.x.c) bump("topic", 1, false, r.x.c); }
    var s = E.s;
    if (s && !s.over && r.ok) { bump("combo", s.streak, true); bump("combo8", s.streak, true); if (s.m.id === "blitz") bump("blitz", s.score, true); }
  });
  WF.on("roundEnd", function (s) {
    if (!s || !s.m) return;
    if (s.m.daily) bump("daily", 1);
    if (s.m.learn && s.score + s.wrong.length > 0) bump("learn", 1);
  });
  WF.on("timelineEnd", function () { bump("tl", 1); });
  WF.on("estimateEnd", function () { bump("est", 1); });
  WF.on("ladderEnd", function () { bump("ladder", 1); });

  /* Truhe: zufällige Belohnung, gewichtet */
  var REWARDS = [[40, "xp", 50], [25, "xp", 100], [15, "xp", 200], [20, "freeze", 1]];
  H.chest = function () {
    var Q = today(); if (Q.chest || !Q.list.every(function (q) { return q.p >= q.t; })) return;
    var roll = Math.random() * 100, acc = 0, rw = REWARDS[0];
    for (var i = 0; i < REWARDS.length; i++) { acc += REWARDS[i][0]; if (roll < acc) { rw = REWARDS[i]; break; } }
    var st = S(), txt;
    if (rw[1] === "freeze" && (st.streak.freeze || 0) < 2) { st.streak.freeze = (st.streak.freeze || 0) + 1; txt = "Serienschutz +1"; }
    else { var xp = rw[1] === "xp" ? rw[2] : 100; E.addXP(xp); txt = "+" + xp + " XP"; }
    Q.chest = txt; WF.store.save();
    ui.go("home");
    var el = document.querySelector(".chestbox"); if (el) el.classList.add("opened");
  };

  WF.registerEntry({ where: "home", order: 2, render: function () {
    var Q = today(), done = Q.list.filter(function (q) { return q.p >= q.t; }).length, fr = S().streak.freeze || 0;
    var h = '<div class="card quests"><div class="row sb"><b>Tagesaufgaben</b><span class="small mute">' + done + " / 3" + (fr ? " · 🛡 " + fr : "") + "</span></div>";
    Q.list.forEach(function (q) {
      var ok = q.p >= q.t;
      h += '<div class="quest' + (ok ? " done" : "") + '"><div class="row sb small"><span>' + (ok ? "✓ " : "") + esc(typeOf(q).txt(q)) + '</span><span class="mute">' + q.p + "/" + q.t + "</span></div>" + ui.bar(q.p / q.t * 100, typeOf(q).txt(q)) + "</div>";
    });
    if (Q.chest) h += '<div class="chestbox opened"><span class="chest" aria-hidden="true">🎁</span><span>Heute gewonnen: <b>' + esc(Q.chest) + "</b></span></div>";
    else if (done === 3) h += '<div class="chestbox ready">' + btn("chest", "🎁 Truhe öffnen", { primary: true }) + "</div>";
    else h += '<p class="small mute" style="margin:8px 0 0">Alle drei erledigen öffnet eine Truhe mit Belohnung.</p>';
    return h + "</div>";
  } });
})();
