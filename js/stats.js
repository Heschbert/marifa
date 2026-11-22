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

  /* Statistikseite (aus dem Profil): Zahlen statt Lernmodus. Ohne Thema: Überblick über alles, mit Thema: Bereiche im Detail. */
  var E = WF.engine, D = WF.data, ui = WF.ui;
  function kpi(v, l) { return '<div class="stat"><b>' + v + "</b><span>" + l + "</span></div>"; }
  function statView(c) {
    ui.setView(function () { statView(c); });
    var st = S(), qs = st.qs, list = D.realList(c || null, null), seen = 0, known = 0, sure = 0, wrongNow = 0;
    list.forEach(function (x) { var r = qs[x.id]; if (r) { seen++; if (r.b >= 1) known++; if (r.b >= 3) sure++; if (r.b === 0) wrongNow++; } });
    var acc = E.accIn(c || null), lp = E.levelPct(c || null);
    var h = '<button class="ghost" data-act="profile">‹ Profil</button><h1>' + (c ? esc(c) : "Statistik") + "</h1>";
    h += '<div class="card ksum">' + ui.ring(lp, c ? ui.topicColor(c) : "var(--play)", E.fmtPct(lp) + "%") + '<div class="grow"><b>Wissensstand ' + E.fmtPct(lp) + ' %</b><p class="small mute" style="margin:2px 0 0">' + list.length + " Fragen in " + (c ? "diesem Thema" : "allen Themen") + "</p></div></div>";
    h += '<div class="stats stats4">' + kpi(seen, "gesehen") + kpi(known, "gewusst") + kpi(sure, "sicher") + kpi(acc.t ? U.pct(acc.r, acc.t) + " %" : "–", "Trefferquote") + "</div>";
    h += '<p class="small mute" style="margin:8px 2px 0">Gewusst: zuletzt richtig. Sicher: mehrmals richtig, auch nach Tagen. ' + wrongNow + " Fragen sind gerade offen (zuletzt falsch).</p>";
    if (!c) {
      var days = Object.keys(st.days).filter(function (k) { return st.days[k] > 0; }), tot = st.tot;
      h += "<h2>Insgesamt</h2>" + '<div class="stats stats4">' + kpi(tot.t, "Antworten") + kpi(days.length, "Lerntage") + kpi(st.streak.best, "beste Serie") + kpi(days.length ? Math.round(tot.t / days.length) : 0, "pro Lerntag") + "</div>";
      h += "<h2>Themen</h2>" + '<div class="card">';
      D.topics.forEach(function (t) { h += row(t.c, null, t.c); });
      h += "</div>";
    } else {
      h += "<h2>Bereiche</h2>" + '<div class="card">';
      D.subsOf(c).forEach(function (sb) { h += row(c, sb, sb); });
      h += "</div>" + '<div style="margin-top:12px">' + ui.btn("scope", "Dieses Thema lernen", { data: { c: c, s: "" } }) + "</div>";
    }
    ui.show(h, "profile");
  }
  function row(c, s, title) {
    var lp = E.levelPct(c, s), a = E.accIn(c, s), n = E.totalIn(c, s), k = E.knownIn(c, s);
    return '<button class="srow" data-act="stat" data-c="' + esc(c) + '"' + (s ? " disabled" : "") + '><div class="row sb small"><b>' + esc(title) + '</b><span class="mute">' + k + " / " + n + (a.t ? " · " + U.pct(a.r, a.t) + " % richtig" : "") + "</span></div>" + ui.bar(lp, title) + "</button>";
  }
  ui.H.stat = function (d) { statView(d.c || null); };

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
