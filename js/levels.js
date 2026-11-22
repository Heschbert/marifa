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
    ["Truhe der Tagesaufgaben", "50–200 XP"],
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
  ui.views = ui.views || {}; ui.views.levels = view;
})();
