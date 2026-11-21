/* Lernverlauf: zählt je Tag beantwortete Fragen und Treffer (ab dieser Version) und zeigt die letzten 14 Tage im Profil.
   Ältere Tage haben nur die Anzahl (aus days), keine Trefferquote. */
(function () {
  "use strict";
  var WF = window.WF, U = WF.util, esc = U.esc;
  function S() { return WF.store.data; }

  WF.on("answered", function (r) {
    if (r.x.retry) return;
    var h = S().hist || (S().hist = {}), t = U.today(), d = h[t] || (h[t] = { r: 0, t: 0 });
    d.t++; if (r.ok) d.r++;
    /* engine speichert direkt nach dem Ereignis */
  });

  function lastDays(n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate() - i); out.push(d); }
    return out;
  }
  var WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  WF.registerEntry({ where: "profile", order: 10, render: function () {
    var st = S(), days = lastDays(14), max = 1, sumT = 0, sumR = 0, sumN = 0;
    days.forEach(function (d) { var k = U.dkey(d); max = Math.max(max, st.days[k] || 0); });
    days.slice(-7).forEach(function (d) { var k = U.dkey(d), hd = (st.hist || {})[k]; sumN += st.days[k] || 0; if (hd) { sumT += hd.t; sumR += hd.r; } });
    var h = '<h2>Verlauf · 14 Tage</h2><div class="card"><div class="chart" role="img" aria-label="Beantwortete Fragen der letzten 14 Tage">';
    days.forEach(function (d) {
      var k = U.dkey(d), v = st.days[k] || 0, hd = (st.hist || {})[k], tip = d.getDate() + "." + (d.getMonth() + 1) + ".: " + v + (hd && hd.t ? " · " + U.pct(hd.r, hd.t) + " % richtig" : "");
      h += '<div class="col" title="' + esc(tip) + '"><span class="v">' + (v || "") + '</span><i style="height:' + Math.round(v / max * 100) + '%"' + (k === U.today() ? ' class="today"' : "") + '></i><span class="d">' + WD[d.getDay()] + "</span></div>";
    });
    h += '</div><p class="small mute" style="margin:10px 0 0">Letzte 7 Tage: ' + sumN + " Antworten" + (sumT ? " · " + U.pct(sumR, sumT) + " % richtig" : "") + ". Tagesziel: " + WF.engine.consts.GOAL + ".</p></div>";
    return h;
  } });
})();
