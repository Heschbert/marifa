/* Levelübersicht: alle 30 Level mit Titel und XP-Schwelle, Fortschritt zum nächsten Level und woher XP kommen.
   Erreichbar über das Level-Abzeichen auf der Startseite und die Levelkarte im Profil. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H;
  function S() { return WF.store.data; }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  /* Woher XP kommen. Werte wie in engine.js, quests.js, courses.js, ladder.js, timeline.js. */
  var SOURCES = [
    ["Richtige Antwort", "10–20 XP, mal Combo bis ×4"],
    ["Tagesziel (10 Antworten)", "+50 XP"],
    ["Alle 3 Tagesaufgaben", "+100 XP"],
    ["Wissensleiter", "Punkte ÷ 10, bis 300 XP"],
    ["Zeitstrahl", "bis 20 XP pro Reihe"],
    ["Kurs: richtige Antwort", "10 XP"],
    ["Kurs: Modul bestanden", "+50 XP"],
    ["Kurs: Zertifikat", "+150 XP"]
  ];
  function view() {
    ui.setView(view);
    var st = S(), L = E.levelOf(st.xp), max = E.MAXLVL, a = E.lvlStart(L), b = E.lvlStart(L + 1), top = E.lvlStart(max);
    var p = L >= max ? 100 : (st.xp - a) / (b - a) * 100;
    var h = '<button class="ghost" data-act="home">‹ Zurück</button><h1>Level</h1>';
    h += '<div class="card lvhead">' + ui.ring(p, "var(--accent)", String(L)) + '<div class="grow"><b>Level ' + L + " · " + esc(E.titleOf(L)) + '</b><p class="small mute" style="margin:2px 0 0">' +
      (L >= max ? "Höchstlevel erreicht. Glückwunsch!" : fmt(st.xp) + " XP · noch <b>" + fmt(b - st.xp) + " XP</b> bis Level " + (L + 1)) + "</p></div></div>";
    h += '<div class="card"><div class="row sb small"><b>Weg zum Höchstlevel ' + max + '</b><span class="mute">' + U.pct(st.xp, top) + " %</span></div>" + ui.bar(st.xp / top * 100, "Fortschritt zum Höchstlevel") +
      '<p class="small mute" style="margin:6px 0 0">' + fmt(st.xp) + " von " + fmt(top) + " XP · " + max + " Level, " + (max - L) + " noch offen</p></div>";
    h += '<h2>So sammelst du XP</h2><div class="card"><table class="xptable">' + SOURCES.map(function (s) { return "<tr><td>" + esc(s[0]) + "</td><td>" + esc(s[1]) + "</td></tr>"; }).join("") + "</table></div>";
    h += '<h2>Alle Level</h2><div class="lvlist">';
    for (var i = 1; i <= max; i++) {
      var got = i <= L, cur = i === L, need = E.lvlStart(i);
      var newTitle = i === 1 || E.titleOf(i) !== E.titleOf(i - 1);
      h += '<div class="lvrow' + (got ? " got" : "") + (cur ? " cur" : "") + '"><span class="ico">' + i + '</span><span>' + (newTitle ? "<b>" + esc(E.titleOf(i)) + "</b>" : esc(E.titleOf(i))) + '</span><span class="xpneed">' + (got ? (cur ? "aktuell" : "✓") : fmt(need) + " XP") + "</span></div>";
    }
    h += "</div>";
    ui.show(h, "home", false);
  }
  H.levels = function () { view(); };

  /* Serie und Serienschutz erklärt. Erreichbar über das Serien-Abzeichen auf der Startseite. */
  function streakView() {
    ui.setView(streakView);
    var st = S(), n = E.curStreak(), fr = st.streak.freeze || 0, next = 7 - (n % 7);
    var h = '<button class="ghost" data-act="home">‹ Zurück</button><h1>Serie</h1>';
    h += '<div class="card lvhead">' + ui.ring(Math.min(100, (n % 7) / 7 * 100), "var(--accent)", String(n)) + '<div class="grow"><b>' + n + (n === 1 ? " Tag" : " Tage") + ' in Folge</b><p class="small mute" style="margin:2px 0 0">Ein Tag zählt, sobald du mindestens eine Frage beantwortest.</p></div></div>';
    h += '<h2>Serienschutz · ' + fr + " von 2</h2>";
    h += '<div class="card"><div class="shields">' + [0, 1].map(function (i) { return '<span class="shield' + (i < fr ? " on" : "") + '" aria-hidden="true">🛡</span>'; }).join("") + "</div>" +
      '<p style="margin:10px 0 0">Verpasst du einen Tag, wird <b>automatisch</b> ein Serienschutz verbraucht und deine Serie läuft weiter. Du musst nichts einlösen.</p>' +
      '<p class="small mute" style="margin:8px 0 0">Du bekommst einen Serienschutz für je 7 Tage in Folge, höchstens 2 auf Vorrat.' + (fr < 2 ? " Der nächste kommt in " + next + (next === 1 ? " Tag." : " Tagen.") : " Dein Vorrat ist voll.") + "</p></div>";
    h += '<h2>Abzeichen</h2><div class="card"><p style="margin:0">Abzeichen sind Erinnerungen an besondere Leistungen, zum Sammeln. Sie bringen keine Punkte und lassen sich nicht einlösen. Alle findest du im <button class="link" data-act="goprofile">Profil</button>.</p></div>';
    ui.show(h, "home", false);
  }
  H.streakinfo = function () { streakView(); };
  H.goprofile = function () { ui.go("profile"); };
  ui.views = ui.views || {}; ui.views.levels = view;
})();
