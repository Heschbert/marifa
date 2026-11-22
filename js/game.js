/* Spielgefühl rund um die Runde: Sterne auf dem Ergebnisbildschirm, „Rekord geknackt!“ während der Runde. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, ui = WF.ui, U = WF.util;
  function S() { return WF.store.data; }

  /* Schwellen für 1, 2, 3 Sterne. Blitz und Überleben zählen richtige Antworten, sonst Trefferquote in Prozent. */
  var STARS = { blitz: [6, 10, 15], survive: [5, 10, 20] };
  function stars(s) {
    var id = s.m.id, n = s.score + s.wrong.length;
    if (STARS[id]) { var t = STARS[id], v = s.score; return { n: v >= t[2] ? 3 : v >= t[1] ? 2 : v >= t[0] ? 1 : 0, next: v >= t[2] ? 0 : (v >= t[1] ? t[2] : v >= t[0] ? t[1] : t[0]) - v, unit: "richtige" }; }
    if (!n) return null;
    var p = s.score / n, need = function (q) { return Math.max(0, Math.ceil(q * n - s.score)); };
    /* 1 Stern ab 40 %, 2 ab 60 %, 3 ab 90 % (3 von 5 = 2 Sterne, 9 von 10 = 3 Sterne) */
    return { n: p >= 0.9 ? 3 : p >= 0.6 ? 2 : p >= 0.4 ? 1 : 0, next: p >= 0.9 ? 0 : need(p >= 0.6 ? 0.9 : p >= 0.4 ? 0.6 : 0.4), unit: "richtige mehr" };
  }
  WF.registerEntry({ where: "resulthead", order: 1, render: function (c) {
    var st = stars(c.s); if (!st) return "";
    var h = '<div class="rstars"><div class="stars" role="img" aria-label="' + st.n + ' von 3 Sternen">';
    for (var i = 0; i < 3; i++) h += '<span class="star' + (i < st.n ? " on" : "") + '" style="animation-delay:' + (i * 0.18) + 's">★</span>';
    h += "</div>" + (st.next ? '<span class="small mute">+' + st.next + " für " + (st.n + 1) + " ★</span>" : '<span class="small mute">Bestwertung</span>') + "</div>";
    return h;
  } });

  /* Fortschritt dieser Runde: welche Themen sind gewachsen? Zählt Fragen, die vorher neu oder zuletzt falsch waren. */
  WF.on("answered", function (r) {
    var s = E.s; if (!s || !r.ok || !r.x || r.x.retry || r.x.gen || r.before === undefined || r.before >= 1) return;
    var g = s.grow || (s.grow = {}); g[r.x.c] = (g[r.x.c] || 0) + 1;
  });
  WF.registerEntry({ where: "result", order: 2, render: function (c) {
    var g = c.s.grow; if (!g) return "";
    var ks = Object.keys(g).sort(function (a, b) { return g[b] - g[a]; }), n = 0; ks.forEach(function (k) { n += g[k]; });
    var h = '<div class="card grow-card"><b>+' + n + (n === 1 ? " Frage" : " Fragen") + ' neu gewusst</b><div class="growlist">';
    ks.slice(0, 4).forEach(function (k) { var p = E.levelPct(k); h += '<div class="row">' + ui.ring(p, ui.topicColor(k), E.fmtPct(p) + "%") + '<div class="grow"><div class="small"><b>' + U.esc(k) + '</b></div><div class="small mute">+' + g[k] + " · Wissensstand " + E.fmtPct(p) + " %</div></div></div>"; });
    return h + "</div></div>";
  } });

  /* Rekord in Blitz und Überleben: einmal pro Runde melden, sobald der alte Bestwert übertroffen ist. */
  WF.on("answered", function (r) {
    var s = E.s; if (!s || !r.ok || !s.m || r.x.retry) return;
    var best = s.m.id === "blitz" ? S().best.blitz : s.m.id === "survive" ? S().best.survive : 0;
    if (best > 0 && s.score === best + 1 && !s.recToast) { s.recToast = true; WF.emit("toast", { title: "Rekord geknackt!", sub: "Bisher: " + best }); }
  });
})();
