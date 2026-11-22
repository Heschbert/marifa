/* Tagesrätsel teilen: Ergebnis als kurzer Text mit Kästchen, über das Teilen-Menü des Handys oder die Zwischenablage. */
(function () {
  "use strict";
  var WF = window.WF, U = WF.util, ui = WF.ui, H = ui.H;

  function text(r, day) {
    var n = WF.engine.consts.DAILY_N, log = r.log || [];
    var boxes = log.map(function (ok) { return ok ? "🟩" : "🟥"; }).join("") + Array(Math.max(0, n - log.length) + 1).join("⬜");
    return "Marifa · Tagesrätsel " + day.split("-").reverse().join(".") + "\n" + r.s + " von " + n + "\n" + boxes;
  }
  H.share = function () {
    var day = U.today(), r = WF.store.data.dailyDone[day];
    if (!r) return;
    var t = text(r, day);
    if (navigator.share) { navigator.share({ text: t }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(t).then(function () { ui.toast({ title: "Ergebnis kopiert", sub: "Jetzt in einen Chat einfügen." }); }, function () { ui.toast({ title: "Teilen nicht möglich", sub: t }); }); }
    catch (e) { ui.toast({ title: "Teilen nicht möglich", sub: t }); }
  };
  function shareBtn() { return WF.store.data.dailyDone[U.today()] ? '<div style="margin:12px 0">' + ui.btn("share", "Ergebnis teilen") + "</div>" : ""; }
  WF.registerEntry({ where: "result", order: 10, render: function (c) { return c.s.m.daily ? shareBtn() : ""; } });
  WF.registerEntry({ where: "home", order: 5, render: function () { var r = WF.store.data.dailyDone[U.today()]; return r && r.log ? '<div style="margin:-4px 0 12px">' + ui.btn("share", "Tagesrätsel-Ergebnis teilen") + "</div>" : ""; } });
})();
