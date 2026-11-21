/* Menüeinträge der eingebauten Modi. Jedes Feature kann sich genauso mit WF.registerEntry eintragen
   (siehe duel.js, cards.js, browse.js). Die Reihenfolge steuert order. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, ui = WF.ui;
  function n(k, one, many) { return k + " " + (k === 1 ? one : many); }

  /* Spielen */
  WF.registerEntry({ where: "home", order: 10, render: function () { return ui.row("play", "10", "Test", "10 Fragen mit Erklärung", { m: "classic" }); } });
  WF.registerEntry({ where: "home", order: 20, render: function (c) { return ui.row("play", "60", "Blitz", "60 Sekunden · Rekord " + c.st.best.blitz, { m: "blitz" }); } });
  WF.registerEntry({ where: "home", order: 30, render: function (c) { return ui.row("play", "♥", "Überleben", "3 Leben · Rekord " + c.st.best.survive, { m: "survive" }); } });

  /* Lernen */
  WF.registerEntry({ where: "areas", order: 10, render: function () {
    var k = E.dueList({}).length; return k ? ui.row("start", "⏰", "Heute fällig", n(k, "Frage", "Fragen") + " zum Wiederholen", { m: "review", c: "", s: "" }) : ""; } });
  WF.registerEntry({ where: "areas", order: 20, render: function () {
    var k = E.missedList({}).length; return k ? ui.row("start", "!", "Fehler wiederholen", n(k, "Frage", "Fragen") + ", die zuletzt falsch waren", { m: "missed", c: "", s: "" }) : ""; } });
  WF.registerEntry({ where: "areas", order: 30, render: function () {
    var k = E.savedList().length; return k ? ui.row("start", "★", "Merkliste", n(k, "Frage", "Fragen") + " gemerkt", { m: "saved", c: "", s: "" }) : ""; } });

  /* Themenseite */
  WF.registerEntry({ where: "scope", order: 20, render: function (c) {
    var k = E.missedList({ c: c.c, s: c.s }).length; return k ? ui.row("start", "!", "Fehler wiederholen", n(k, "Frage", "Fragen"), { m: "missed", c: c.c, s: c.s || "" }) : ""; } });
})();
