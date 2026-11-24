/* Einstieg für neue Nutzer: drei kurze Bildschirme (Willkommen, Interessen, Tagesziel).
   Erscheint nur beim allerersten Start ohne Spielstand. Bestehende Spielstände gelten als eingerichtet.
   Interessen landen in st.settings.fav und bestimmen „Deine Themen“ im Lernen. */
(function () {
  "use strict";
  var WF = window.WF, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var pick = [];
  function dots(n) { return '<div class="obdots">' + [0, 1, 2].map(function (i) { return "<i" + (i === n ? ' class="on"' : "") + "></i>"; }).join("") + "</div>"; }
  function step1() {
    ui.show('<div class="onb">' + dots(0) + '<div class="oblogo" aria-hidden="true">m<i></i></div><h1>Willkommen bei Marifa</h1>' +
      '<p class="mute">Spielerisch das wichtigste Wissen lernen, ein paar Minuten am Tag.</p><ul class="obl">' +
      "<li><b>Spielen</b><span>Quiz, Blitz, Duelle und jeden Tag ein Rätsel</span></li>" +
      "<li><b>Lernen</b><span>Falsches kommt wieder, bis es sitzt; Kernwissen zuerst</span></li>" +
      "<li><b>Kurse</b><span>Fachwissen Schritt für Schritt mit Urkunde</span></li></ul>" +
      '<p class="small mute">Kein Konto, keine Werbung. Dein Fortschritt bleibt auf diesem Gerät.</p>' +
      btn("ob2", "Weiter", { primary: true }) + '<div style="height:8px"></div><button class="link" data-act="obskip">Überspringen</button></div>', null);
  }
  H.ob2 = function () {
    pick = (S().settings.fav || []).slice();
    var h = '<div class="onb">' + dots(1) + "<h1>Was interessiert dich?</h1><p class=\"mute\">Wähle ein paar Themen. Du kannst später alles spielen.</p><div class=\"obchips\">";
    D.topics.forEach(function (t) { h += '<button class="chipsel' + (pick.indexOf(t.c) >= 0 ? " on" : "") + '" aria-pressed="' + (pick.indexOf(t.c) >= 0) + '" data-act="obpick" data-c="' + esc(t.c) + '">' + esc(t.c) + "</button>"; });
    ui.show(h + "</div>" + btn("ob3", "Weiter", { primary: true }) + "</div>", null);
  };
  H.obpick = function (d, el) {
    var i = pick.indexOf(d.c); if (i >= 0) pick.splice(i, 1); else pick.push(d.c);
    el.classList.toggle("on", i < 0); el.setAttribute("aria-pressed", String(i < 0));
  };
  H.ob3 = function () {
    S().settings.fav = pick.slice(); WF.store.save();
    var g = String(S().settings.goal || "10");
    var opt = [["5", "Locker", "5 Fragen am Tag"], ["10", "Normal", "10 Fragen am Tag"], ["20", "Ehrgeizig", "20 Fragen am Tag"]];
    ui.show('<div class="onb">' + dots(2) + "<h1>Dein Tagesziel</h1><p class=\"mute\">Wie viel willst du täglich schaffen? Jeder erreichte Tag zählt für deine Serie und bringt +50 XP.</p><div class=\"obgoals\">" +
      opt.map(function (o) { return '<button class="obgoal' + (g === o[0] ? " on" : "") + '" data-act="obgoal" data-v="' + o[0] + '"><b>' + o[1] + "</b><span>" + o[2] + "</span></button>"; }).join("") +
      "</div>" + btn("obdone", "Los geht’s", { primary: true }) + "</div>", null);
  };
  H.obgoal = function (d) { S().settings.goal = d.v; WF.store.save(); H.ob3(); };
  function finish() { S().settings.onboarded = 1; WF.store.save(); ui.go("home"); }
  H.obdone = finish;
  H.obskip = finish;
  WF.on("ready", function () {
    var st = S();
    if (st.settings.onboarded) return;
    if (st.tot.t > 0 || /^#d/.test(location.hash || "")) { st.settings.onboarded = 1; WF.store.save(); return; }
    step1();
  });
  /* Lernen: „Deine Themen“ als Startpunkt, wenn Interessen gewählt sind */
  H.favgo = function () { var f = S().settings.fav || []; if (f.length) ui.startWith("learn", { c: null, s: null, sel: f }); };
  /* Tagesziel im Profil änderbar */
  WF.registerEntry({ where: "settings", order: 1, render: function () {
    if (!S().settings.goal) S().settings.goal = "10";
    return ui.prefSeg("Tagesziel", "goal", [["5", "5 Fragen"], ["10", "10 Fragen"], ["20", "20 Fragen"]]);
  } });
})();
