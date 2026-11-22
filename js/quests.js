/* Tagesaufgaben: jeden Tag drei kleine Aufgaben (für alle gleich ausgelost). Sind alle erledigt,
   lässt sich eine Truhe mit zufälliger Belohnung öffnen: XP oder Serienschutz. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }

  /* Aufgabentypen. t = Ziel, ev = wie Fortschritt entsteht. */
  var TYPES = [
    { id: "ans", t: 20, txt: function () { return "20 Fragen beantworten"; } },
    { id: "right", t: 12, txt: function () { return "12 Fragen richtig beantworten"; } },
    { id: "combo", t: 5, txt: function () { return "5 richtige Antworten in Folge"; } },
    { id: "combo8", t: 8, txt: function () { return "8 richtige Antworten in Folge"; } },
    { id: "topic", t: 5, txt: function (q) { return "5 richtige Antworten in " + q.c; } },
    { id: "daily", t: 1, txt: function () { return "Das Tagesrätsel spielen"; } },
    { id: "blitz", t: 7, txt: function () { return "Im Blitz 7 richtige in einer Runde"; } },
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
    /* Ziele aus TYPES übernehmen (falls sie mit einem Update gesenkt wurden) */
    st.quests.list.forEach(function (q) { var t = typeOf(q); if (t && q.t !== t.t) q.t = Math.min(q.t, t.t); });
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
    var s = r.course ? null : E.s;
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
    ui.toast({ title: "Truhe geöffnet", sub: txt });
  };

  /* Startseite: kompakte Liste mit Fortschrittsringen. Sind alle erledigt und die Truhe offen, nur noch eine Zeile. */
  var ICO = { ans: "?", right: "✓", combo: "🔥", combo8: "🔥", topic: "◆", daily: "☀", blitz: "60", learn: "📖", est: "≈", tl: "↹", ladder: "⇧" };
  WF.registerEntry({ where: "home", order: 2, render: function () {
    var Q = today(), done = Q.list.filter(function (q) { return q.p >= q.t; }).length, fr = S().streak.freeze || 0;
    if (done === 3 && Q.chest) return '<div class="card daydone"><span class="ico" aria-hidden="true">🎁</span><div class="grow"><b>Tagesaufgaben erledigt</b><div class="small mute">Gewonnen: ' + esc(Q.chest) + (fr ? " · Serienschutz " + fr : "") + " · morgen gibt es neue</div></div></div>";
    var h = '<div class="card quests"><div class="qhead"><b>Tagesaufgaben</b><span class="small mute">' + done + " von 3" + (fr ? " · 🛡 " + fr : "") + "</span></div>";
    Q.list.forEach(function (q) {
      var ok = q.p >= q.t, p = Math.round(q.p / q.t * 100);
      h += '<div class="qrow' + (ok ? " done" : "") + '">' + ui.ring(p, "var(--accent)", ok ? "✓" : ICO[q.id] || "•") + '<div class="grow"><div class="t">' + esc(typeOf(q).txt(q)) + "</div></div><span class=\"xp\">" + q.p + " / " + q.t + "</span></div>";
    });
    if (done === 3) h += '<div class="chestline"><span aria-hidden="true">🎁</span><b>Truhe bereit</b>' + btn("chest", "Öffnen", { primary: true }) + "</div>";
    else h += '<div class="chestline"><span aria-hidden="true">🎁</span><span class="mute">Alle 3 erledigen öffnet eine Truhe: XP oder Serienschutz.</span></div>';
    return h + "</div>";
  } });
})();
