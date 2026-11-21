/* Spielmodi. Jeder Modus ist ein eigener Baustein mit denselben Eigenschaften:
   build(session) liefert die Fragen, helps ("free", "limited", "none") regelt die Hilfen,
   timer, lives, extend, requeue und daily steuern den Ablauf. Neue Modi (zum Beispiel Duell oder Karteikarten)
   werden mit WF.registerMode ergänzt. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, C = E.consts;

  WF.registerMode({
    id: "learn", title: "Lernen", learn: true, helps: "free", requeue: true,
    desc: "Erst, was du noch nicht sicher kannst. Falsche Antworten kommen in derselben Runde wieder, bis sie sitzen.",
    build: function (s) { return E.orderLearn(E.pool(s.scope)).slice(0, C.ROUND); }
  });
  WF.registerMode({
    id: "review", title: "Fällige Wiederholung", learn: true, helps: "free", requeue: true, scoped: false,
    desc: "Fragen, die nach Plan wieder dran sind",
    build: function (s) { return E.dueList(s.scope).slice(0, C.ROUND); }
  });
  WF.registerMode({
    id: "saved", title: "Merkliste", learn: true, helps: "free", requeue: true, scoped: false,
    desc: "Deine gemerkten Fragen",
    build: function () { return E.orderLearn(E.savedList()).slice(0, C.ROUND); }
  });
  WF.registerMode({
    id: "classic", title: "Test", helps: "limited",
    desc: "10 Fragen mit Erklärung",
    build: function (s) { return E.order(E.pool(s.scope), !s.scope.c).slice(0, C.ROUND); }
  });
  WF.registerMode({
    id: "blitz", title: "Blitz", helps: "none", timer: C.BLITZ_S, extend: true, auto: true,
    desc: "60 Sekunden",
    build: function (s) { return E.order(E.pool(s.scope), !s.scope.c).slice(0, 30); }
  });
  WF.registerMode({
    id: "survive", title: "Überleben", helps: "none", lives: C.LIVES, extend: true,
    desc: "3 Leben",
    build: function (s) { return E.order(E.pool(s.scope), !s.scope.c).slice(0, 30); }
  });
  WF.registerMode({
    id: "missed", title: "Fehler üben", learn: true, helps: "free", requeue: true, needsMissed: true,
    desc: "Fragen, die zuletzt falsch waren",
    build: function (s) { return E.order(E.missedList(s.scope), !s.scope.c).slice(0, C.ROUND); }
  });
  WF.registerMode({
    id: "daily", title: "Tagesrätsel", helps: "limited", daily: true, scoped: false, prepped: true,
    desc: "5 Fragen, für alle gleich",
    build: function () { return E.dailyList(); }
  });
})();
