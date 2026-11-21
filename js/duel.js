/* Duell: zwei (oder mehr) Spieler an einem Handy. Jeder stimmt geheim ab, danach wird aufgelöst.
   Spielstand und Fragenfolge liegen in einem eigenen Zustand, damit später ein Netzwerk-Transport
   (zwei Handys) denselben Ablauf nutzen kann: nur die Weitergabe der Antworten würde ersetzt. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  var G = null, setup = { rounds: 10, n1: "Spieler 1", n2: "Spieler 2" };

  function shell(inner) { return '<h1>Duell</h1>' + inner; }
  function scoreLine() { return '<div class="grid2">' + G.players.map(function (p, i) { return '<div class="stat"><b>' + G.score[i] + "</b><span>" + esc(p) + "</span></div>"; }).join("") + "</div>"; }

  function setupScreen() {
    ui.setView(function () { readNames(); setupScreen(); });
    var h = shell('<p class="mute">Beide sehen dieselbe Frage. Jeder tippt für sich, ohne dass der andere es sieht.</p>' +
      '<div class="card cfg" style="margin-bottom:12px">' + ui.rubrikSel() + ui.diffSeg().replace('class="cfg"', 'class="cfg" style="margin:0"') + '</div><div class="card"><label class="small mute">Name 1</label><input id="n1" class="inp" maxlength="16" value="' + esc(setup.n1) + '">' +
      '<label class="small mute">Name 2</label><input id="n2" class="inp" maxlength="16" value="' + esc(setup.n2) + '"></div>' +
      '<h2>Fragen</h2><div class="seg" style="grid-template-columns:repeat(3,1fr)">' +
      [5, 10, 15].map(function (n) { return '<button class="' + (setup.rounds === n ? "on" : "") + '" data-act="drounds" data-n="' + n + '">' + n + "</button>"; }).join("") + "</div>" +
      '<div style="margin-top:16px">' + btn("dstart", "Los geht’s", { primary: true }) + "</div>" +
      '<div style="margin-top:8px">' + btn("home", "Zurück") + "</div>");
    ui.show(h, "home");
  }
  function readNames() {
    var a = document.getElementById("n1"), b = document.getElementById("n2");
    if (a) setup.n1 = a.value.trim() || "Spieler 1";
    if (b) setup.n2 = b.value.trim() || "Spieler 2";
  }
  H.duel = setupScreen;
  H.drounds = function (d) { readNames(); setup.rounds = +d.n; setupScreen(); };
  H.dstart = function () {
    readNames();
    var c = ui.playC(), list = E.order(E.pool({ c: c }), !c).slice(0, setup.rounds).map(function (x) { return E.prep(x); });
    G = { scope: c, players: [setup.n1, setup.n2], score: [0, 0], qs: list, i: 0, p: 0, picks: [] };
    handover();
  };

  function handover() {
    var name = G.players[G.p];
    ui.show(shell('<p class="mute">Frage ' + (G.i + 1) + " von " + G.qs.length + "</p>" + scoreLine() +
      '<div class="card center2"><p>Gib das Handy an</p><p class="big">' + esc(name) + "</p></div>" + btn("dready", "Ich bin " + name, { primary: true })), null);
  }
  H.dready = function () {
    var x = G.qs[G.i];
    var h = '<div class="topbar"><span class="chip">' + esc(G.players[G.p]) + " ist dran</span><span class=\"chip\">" + (G.i + 1) + " / " + G.qs.length + "</span></div>" +
      '<div class="qmeta">' + esc(x.c) + " · " + esc(x.s) + '</div><p class="q">' + esc(x.q) + "</p>";
    x.opts.forEach(function (o, i) { h += '<button class="ans" data-act="dpick" data-i="' + i + '">' + esc(o.t) + "</button>"; });
    ui.show(h, null);
  };
  H.dpick = function (d) {
    G.picks[G.p] = +d.i;
    if (G.p < G.players.length - 1) { G.p++; handover(); } else reveal();
  };
  function reveal() {
    var x = G.qs[G.i], right = x.opts.filter(function (o) { return o.ok; })[0];
    var h = '<div class="qmeta">Auflösung · ' + (G.i + 1) + " / " + G.qs.length + '</div><p class="q">' + esc(x.q) + "</p>";
    x.opts.forEach(function (o, i) {
      var who = G.players.filter(function (p, k) { return G.picks[k] === i; });
      h += '<div class="ans ' + (o.ok ? "ok" : who.length ? "bad" : "dim") + '">' + esc(o.t) + (who.length ? '<div class="small mute">' + who.map(esc).join(", ") + "</div>" : "") + "</div>";
    });
    G.players.forEach(function (p, k) { if (x.opts[G.picks[k]].ok) G.score[k]++; });
    h += '<div class="fb"><b class="h">' + G.players.map(function (p, k) { return esc(p) + (x.opts[G.picks[k]].ok ? " ✓" : " ✗"); }).join(" · ") + "</b>";
    if (x.e) h += "<p>" + esc(x.e) + "</p>";
    G.picks.forEach(function (pi) { var o = x.opts[pi]; if (!o.ok && o.why) h += '<p class="small"><b>Warum nicht „' + esc(o.t) + '“?</b> ' + esc(o.why) + "</p>"; });
    h += "</div>" + scoreLine() + '<div style="margin-top:12px">' + btn("dnext", G.i + 1 >= G.qs.length ? "Ergebnis" : "Nächste Frage", { primary: true }) + "</div>";
    ui.show(h, null);
  }
  H.dnext = function () {
    G.i++; G.p = 0; G.picks = [];
    if (G.i >= G.qs.length) return end();
    handover();
  };
  function end() {
    var a = G.score[0], b = G.score[1];
    var t = a === b ? "Unentschieden" : (a > b ? G.players[0] : G.players[1]) + " gewinnt";
    ui.show(shell('<div class="score">' + esc(t) + "</div>" + scoreLine() +
      '<div style="margin:16px 0">' + btn("dstart", "Revanche", { primary: true }) + '<div style="height:8px"></div>' + btn("home", "Zur Startseite") + "</div>"), null);
  }
})();
