/* Tagesaufgaben: jeden Tag drei kleine Aufgaben (für alle gleich ausgelost). Sind alle erledigt,
   gibt es sofort und ohne Zufall +100 XP (keine Truhe, nichts zum Einlösen). */
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
    { id: "ladder", t: 1, txt: function () { return "Die Wissensleiter spielen"; } },
    { id: "course", t: 5, need: "course", txt: function () { return "5 Kursfragen oder Karteikarten"; } }
  ];
  function today() {
    var st = S(), d = U.today();
    if (!st.quests || st.quests.day !== d) {
      /* Kursaufgabe nur für alle, die schon einen Kurs begonnen haben */
      var inCourse = !!(st.course && Object.keys(st.course).length);
      var rng = U.mulberry(U.seedOf("quests" + d)), pool = U.shuffle(TYPES.filter(function (t) { return t.need !== "course" || inCourse; }), rng), pick = [], ids = {};
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
    if (changed) { if (Q.list.every(function (q) { return q.p >= q.t; }) && !Q.chest) reward(Q); WF.store.save(); }
  }
  WF.on("answered", function (r) {
    if (r.estimate) return;
    if (r.course && !r.x.retry) bump("course", 1);
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
  WF.on("courseCard", function () { bump("course", 1); });

  /* Belohnung: alle drei Aufgaben erledigt = +100 XP, sofort gutgeschrieben. */
  var BONUS = 100;
  function reward(Q) {
    E.addXP(BONUS); Q.chest = "+" + BONUS + " XP";
    WF.emit("celebrate", { icon: "✓", kind: "quest", title: "Tagesaufgaben geschafft", sub: "+" + BONUS + " XP sind deinem Level gutgeschrieben. Morgen gibt es drei neue Aufgaben." });
  }
  /* Alte Spielstände mit ungeöffneter Truhe: Belohnung direkt gutschreiben */
  H.chest = function () { var Q = today(); if (!Q.chest && Q.list.every(function (q) { return q.p >= q.t; })) { reward(Q); WF.store.save(); } ui.go("home"); };

  /* Startseite: kompakte Liste mit Fortschrittsringen. Sind alle erledigt und die Truhe offen, nur noch eine Zeile. */
  var ICO = { course: "🎓", ans: "?", right: "✓", combo: "🔥", combo8: "🔥", topic: "◆", daily: "☀", blitz: "60", learn: "📖", est: "≈", tl: "↹", ladder: "⇧" };
  /* Aufgabe antippen = passendes Spiel starten */
  H.questgo = function (d) {
    var c = ui.playC();
    switch (d.q) {
      case "daily": return H.start({ m: "daily" });
      case "blitz": return ui.startWith("blitz", { c: c, s: null });
      case "learn": return ui.startWith("learn", { c: null, s: null });
      case "topic": return ui.startWith("classic", { c: d.c, s: null });
      case "est": return H.est ? H.est({}) : null;
      case "tl": return H.tl ? H.tl({ c: "", s: "" }) : null;
      case "ladder": return H.ladder ? H.ladder({}) : null;
      case "course": return ui.go("courses");
      default: return ui.startWith("classic", { c: c, s: null });
    }
  };
  WF.registerEntry({ where: "today", order: 2, render: function () {
    var Q = today(), done = Q.list.filter(function (q) { return q.p >= q.t; }).length;
    if (done === 3 && !Q.chest) { reward(Q); WF.store.save(); }
    if (done === 3) return '<div class="trow"><span class="tic ok">✓</span><span class="grow"><b>Tagesaufgaben</b><span class="small mute">alle erledigt · +' + BONUS + " XP</span></span></div>";
    var h = '<details class="trow" data-keep="quests"' + ui.keepOpen("quests") + '><summary><span class="tic">◎</span><span class="grow"><b>Tagesaufgaben</b><span class="small mute">' + done + " von 3 · alle erledigt = +" + BONUS + ' XP</span></span><span class="tchev" aria-hidden="true">›</span></summary><div class="tin">';
    Q.list.forEach(function (q) {
      var ok = q.p >= q.t, p = Math.round(q.p / q.t * 100);
      /* Offene Aufgaben sind Knöpfe, die direkt das passende Spiel starten */
      h += (ok ? '<div class="qrow done">' : '<button class="qrow qgo" data-act="questgo" data-q="' + q.id + '"' + (q.c ? ' data-c="' + esc(q.c) + '"' : "") + ">") +
        ui.ring(p, "var(--accent)", ok ? "✓" : ICO[q.id] || "•") + '<div class="grow"><div class="t">' + esc(typeOf(q).txt(q)) + '</div><div class="small mute">' + q.p + " / " + q.t + "</div></div>" +
        (ok ? '<span class="okc">✓</span></div>' : '<span class="tgo">Los</span></button>');
    });
    return h + "</div></details>";
  } });
})();
