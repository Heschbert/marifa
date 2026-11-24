/* Einstellungen vor dem Spiel: Nach der Wahl eines Modus lassen sich Themen (alle, einzelne oder eigene Auswahl
   aus Themen und Bereichen), Schwierigkeit und ein, zwei modusspezifische Optionen wählen. Voreinstellungen sind gesetzt,
   die letzte Wahl je Modus wird gemerkt (settings.setup[modus]). Neue Modi tragen sich in OPTS ein. */
(function () {
  "use strict";
  var WF = window.WF, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }

  /* Optionen je Modus: [Schlüssel, Bezeichnung, [[Wert, Text], …], Standard] */
  var OPTS = {
    learn: [["len", "Länge", [["endless", "Ohne Ende"], ["10", "10 Fragen"], ["20", "20 Fragen"]], "endless"]],
    classic: [["n", "Fragen", [["10", "10"], ["20", "20"], ["30", "30"]], "10"], ["helps", "Hilfen", [["limited", "Je 1 Joker"], ["none", "Ohne"]], "limited"]],
    blitz: [["timer", "Zeit", [["60", "60 s"], ["90", "90 s"], ["120", "120 s"]], "60"]],
    survive: [["lives", "Leben", [["1", "1"], ["3", "3"], ["5", "5"]], "3"]]
  };
  var SU = null;

  function conf(m) {
    var st = S().settings, all = st.setup || (st.setup = {}), c = all[m] || (all[m] = { sel: [], o: {} });
    (OPTS[m] || []).forEach(function (o) { if (c.o[o[0]] === undefined) c.o[o[0]] = o[3]; });
    return c;
  }
  function chip(key, label, on, act) {
    return '<button class="schip' + (on ? " on" : "") + '" data-act="' + (act || "sutog") + '" data-k="' + esc(key) + '" aria-pressed="' + on + '">' + esc(label) + "</button>";
  }
  function view() {
    ui.setView(view);
    var m = WF.modes[SU.m], c = conf(SU.m), sel = c.sel, allOn = !sel.length;
    var h = '<button class="ghost" data-act="home">‹ Zurück</button><h1>' + esc(m.title) + '</h1><p class="mute">' + esc(m.desc || "") + "</p>";
    h += '<div class="card cfg" style="margin:12px 0">' + ui.diffSeg().replace('class="cfg"', 'class="cfg" style="margin:0"');
    (OPTS[SU.m] || []).forEach(function (o) {
      h += '<div class="cfg" style="margin:12px 0 0"><label>' + esc(o[1]) + '</label><div class="seg" role="group" style="grid-template-columns:repeat(' + o[2].length + ',1fr)">';
      o[2].forEach(function (v) { var on = String(c.o[o[0]]) === v[0]; h += '<button class="' + (on ? "on" : "") + '" aria-pressed="' + on + '" data-act="suopt" data-k="' + o[0] + '" data-v="' + v[0] + '">' + esc(v[1]) + "</button>"; });
      h += "</div></div>";
    });
    h += "</div>";
    h += '<h2>Themen</h2><div class="schips">' + chip("", "Alle Themen", allOn, "suall");
    D.topics.forEach(function (t) { h += chip(t.c, t.c, sel.indexOf(t.c) >= 0); });
    h += "</div>";
    var subsOn = sel.some(function (k) { return k.indexOf("|") > 0; });
    h += '<details class="card sudet"' + (subsOn ? " open" : "") + '><summary class="small"><b>Bereiche genauer wählen</b>' + (subsOn ? " · " + sel.filter(function (k) { return k.indexOf("|") > 0; }).length + " gewählt" : "") + "</summary>";
    D.topics.forEach(function (t) {
      h += '<div class="small mute" style="margin:10px 0 6px">' + esc(t.c) + '</div><div class="schips">';
      t.subs.forEach(function (sb) { var k = t.c + "|" + sb; h += chip(k, sb, sel.indexOf(k) >= 0); });
      h += "</div>";
    });
    h += "</details>";
    var n = count(c.sel);
    h += '<div class="nextbar">' + btn("sugo", "Los geht's", { primary: true, sub: (allOn ? "Alle Themen" : n + " Fragen zur Auswahl"), off: !n }) + "</div>";
    ui.show(h, "home", SU.m === "learn");
  }
  function count(sel) {
    if (!sel.length) return D.Q.length;
    return D.Q.filter(function (x) { return WF.engine.inSel(x, sel); }).length;
  }
  function scopeOf(sel) {
    if (!sel.length) return { c: null, s: null };
    if (sel.length === 1) { var p = sel[0].split("|"); return { c: p[0], s: p[1] || null }; }
    return { c: null, s: null, sel: sel.slice() };
  }
  H.setup = function (d) { SU = { m: d.m }; view(); };
  H.sutog = function (d) {
    var c = conf(SU.m), i = c.sel.indexOf(d.k);
    if (i >= 0) c.sel.splice(i, 1); else c.sel.push(d.k);
    WF.store.save(); view();
  };
  H.suall = function () { conf(SU.m).sel = []; WF.store.save(); view(); };
  H.suopt = function (d) { conf(SU.m).o[d.k] = d.v; WF.store.save(); view(); };
  H.sugo = function () {
    var c = conf(SU.m), o = c.o, opts = {};
    if (o.n) opts.n = +o.n;
    if (o.helps) opts.helps = o.helps;
    if (o.timer) opts.timer = +o.timer;
    if (o.lives) opts.lives = +o.lives;
    if (o.len) { opts.endless = o.len === "endless"; if (o.len !== "endless") opts.n = +o.len; }
    ui.startWith(SU.m, scopeOf(c.sel), opts);
  };
  WF.setup = { open: function (m) { H.setup({ m: m }); } };

  /* Lernen: eigene Auswahl über denselben Bildschirm */
  WF.registerEntry({ where: "areas", order: 2, render: function () { return ui.row("setup", "✚", "Eigene Auswahl", "Themen und Bereiche frei kombinieren, ohne Ende lernen", { m: "learn" }); } });
})();
