/* Fakt des Tages: zeigt auf der Startseite eine Erklärung aus dem Fragenbestand (nur Kernwissen).
   Jeden Tag für alle gleich ausgelost. Die Texte sind die geprüften Erklärungen der Fragen, keine eigenen Behauptungen. */
(function () {
  "use strict";
  var WF = window.WF, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  var pool = null;
  function today() {
    if (!pool) pool = D.real.filter(function (x) { return x.e && x.e.length >= 70 && x.e.length <= 280 && x.p === 1 && !x.key && !x.gen; })
      .sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    if (!pool.length) return null;
    var rng = U.mulberry(U.seedOf("fact" + U.today()));
    return pool[Math.floor(rng() * pool.length)];
  }
  H.factmore = function (d) { ui.startWith("learn", { c: d.c, s: d.s }); };
  WF.registerEntry({ where: "home", order: 1, render: function () {
    var x = today(); if (!x) return "";
    return '<div class="card fact"><div class="facthead"><span class="factic" aria-hidden="true">💡</span><b>Wusstest du?</b><span class="small mute">' + esc(x.c) + "</span></div>" +
      "<p>" + esc(x.e) + "</p>" + btn("factmore", "Mehr zu " + x.s + " lernen", { data: { c: x.c, s: x.s } }) + "</div>";
  } });
})();
