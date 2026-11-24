/* Lernkalender: ein Kästchen pro Tag der letzten 18 Wochen, je kräftiger, desto mehr Antworten.
   Grundlage ist st.days (Antworten pro Tag). Steht im Profil vor dem 14-Tage-Verlauf. */
(function () {
  "use strict";
  var WF = window.WF, U = WF.util;
  function S() { return WF.store.data; }
  var WEEKS = 18;
  function level(n, goal) { return !n ? 0 : n < goal / 2 ? 1 : n < goal ? 2 : n < goal * 2 ? 3 : 4; }
  WF.registerEntry({ where: "profile", order: 8, render: function () {
    var st = S(), goal = WF.engine.consts.GOAL, d = new Date();
    /* Spalten sind Wochen (Mo–So), die letzte Spalte ist die aktuelle Woche */
    var dow = (d.getDay() + 6) % 7, start = new Date(d); start.setDate(d.getDate() - dow - (WEEKS - 1) * 7);
    var cells = "", active = 0, tk = U.today();
    for (var w = 0; w < WEEKS; w++) {
      cells += '<div class="calcol">';
      for (var i = 0; i < 7; i++) {
        var day = new Date(start); day.setDate(start.getDate() + w * 7 + i);
        var k = U.dkey(day), n = st.days[k] || 0, fut = k > tk;
        if (n) active++;
        cells += '<i class="cal l' + (fut ? "x" : level(n, goal)) + (k === tk ? " now" : "") + '" title="' + k + ": " + n + ' Antworten"></i>';
      }
      cells += "</div>";
    }
    return '<h2>Lernkalender</h2><div class="card"><div class="calgrid" role="img" aria-label="Lernkalender der letzten ' + WEEKS + ' Wochen: an ' + active + ' Tagen gelernt">' + cells + "</div>" +
      '<div class="calleg small mute"><span>An ' + active + (active === 1 ? " Tag" : " Tagen") + " gelernt</span><span>weniger <i class=\"cal l1\"></i><i class=\"cal l2\"></i><i class=\"cal l3\"></i><i class=\"cal l4\"></i> mehr</span></div></div>";
  } });
})();
