/* Spielgefühl rund um die Runde: Sterne auf dem Ergebnisbildschirm, „Rekord geknackt!“ während der Runde. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, ui = WF.ui, U = WF.util;
  function S() { return WF.store.data; }

  /* Bewertung mit 5 Sternen in halben Schritten.
     Fragen-Runden: Trefferquote × 5 (3 von 5 = 60 % = 3 Sterne, 9 von 10 = 4,5 Sterne).
     Blitz: 15 richtige = 5 Sterne, Überleben: 20 richtige = 5 Sterne. */
  var FULL = { blitz: 15, survive: 20 };
  function rating(s) {
    var n = s.score + s.wrong.length, v;
    if (FULL[s.m.id]) v = Math.min(1, s.score / FULL[s.m.id]);
    else { if (!n) return null; v = s.score / n; }
    return { stars: Math.round(v * 10) / 2, pct: Math.round(v * 100), timed: !!FULL[s.m.id] };
  }
  WF.starsHtml = function (n, cls) {
    var h = '<span class="stars5' + (cls ? " " + cls : "") + '" role="img" aria-label="' + String(n).replace(".", ",") + ' von 5 Sternen">';
    for (var i = 0; i < 5; i++) h += '<span class="st5 ' + (n >= i + 1 ? "full" : n >= i + 0.5 ? "half" : "") + '" style="animation-delay:' + (i * 0.08) + 's">★</span>';
    return h + "</span>";
  };
  WF.registerEntry({ where: "resulthead", order: 1, render: function (c) {
    var r = rating(c.s); if (!r) return "";
    return '<div class="rstars">' + WF.starsHtml(r.stars) + '<span class="small mute">' + String(r.stars).replace(".", ",") + " von 5" + (r.timed ? "" : " · " + r.pct + " %") + "</span></div>";
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
