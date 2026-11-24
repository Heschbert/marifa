/* Fragen durchsuchen: alle festen Fragen nach Text, Antwort oder Erklärung finden, mit Lernstand und Merken.
   Rechenaufgaben aus dem Generator sind nicht enthalten, weil sie jedes Mal neu entstehen. */
(function () {
  "use strict";
  var WF = window.WF, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H;
  function S() { return WF.store.data; }
  var query = "", MAX = 40, idx = null;

  function norm(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function answerOf(x) { return x.ans !== undefined ? x.ans : (x.a ? x.a[0] : ""); }
  function buildIdx() { idx = D.real.map(function (x) { return { x: x, t: norm(x.q + " " + answerOf(x) + " " + (x.e || "") + " " + x.s) }; }); }
  function state(x) {
    var r = S().qs[x.id];
    if (!r) return "neu";
    if (r.b >= 3) return "gemeistert";
    if (r.b === 0) return "zuletzt falsch";
    return "Stufe " + r.b + " von 4";
  }

  function results() {
    var q = norm(query).trim();
    if (q.length < 2) return '<p class="mute small">Mindestens zwei Buchstaben eingeben. Gesucht wird in Frage, Antwort und Erklärung.</p>';
    if (!idx) buildIdx();
    var words = q.split(/\s+/), hits = idx.filter(function (o) { return words.every(function (w) { return o.t.indexOf(w) >= 0; }); });
    if (!hits.length) return '<p class="mute">Keine Treffer.</p>';
    var h = '<p class="small mute">' + hits.length + (hits.length === 1 ? " Treffer" : " Treffer") + (hits.length > MAX ? ", die ersten " + MAX + " werden gezeigt" : "") + "</p>";
    hits.slice(0, MAX).forEach(function (o) {
      var x = o.x, sv = S().saved[x.id];
      h += '<details class="card hit"><summary><span class="small mute">' + esc(x.c) + " · " + esc(x.s) + " · " + state(x) + "</span><b>" + esc(x.q) + "</b></summary>" +
        "<p>Antwort: <b>" + esc(answerOf(x)) + "</b></p>" + (x.e ? '<p class="mute">' + esc(x.e) + "</p>" : "") +
        '<button class="link" data-act="bsave" data-id="' + esc(x.id) + '">' + (sv ? "★ Gemerkt" : "☆ Merken") + "</button></details>";
    });
    return h;
  }
  function screen() {
    ui.setView(screen);
    ui.show('<button class="ghost" data-act="areas">‹ Zurück</button><h1>Fragen durchsuchen</h1>' +
      '<input id="bq" class="inp" type="search" placeholder="z. B. Magna Carta, Lunge, Prozent" autocomplete="off" data-input="bsearch" value="' + esc(query) + '">' +
      '<div id="bres">' + results() + "</div>", "areas", true);
  }
  H.browse = function () { screen(); var i = document.getElementById("bq"); if (i && !query) i.focus(); };
  H.bsearch = function (el) { query = el.value; document.getElementById("bres").innerHTML = results(); };
  H.bsave = function (d, t) {
    var sv = S().saved;
    if (sv[d.id]) { delete sv[d.id]; t.textContent = "☆ Merken"; } else { sv[d.id] = 1; t.textContent = "★ Gemerkt"; }
    WF.store.save();
  };
  WF.registerEntry({ where: "areas", order: 40, render: function () { return ui.row("browse", "⌕", "Fragen durchsuchen", D.real.length + " Fragen nach Stichwort finden", {}); } });
})();
