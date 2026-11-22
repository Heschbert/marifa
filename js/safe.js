/* Fortschritt schützen: Speicher dauerhaft anmelden, regelmäßig an die Sicherung erinnern,
   und Hinweis, wenn der Fortschritt leer ist (z. B. nach Neuinstallation auf dem iPhone). */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, U = WF.util, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var lost = false;

  WF.on("ready", function () {
    E.pruneSeen(); WF.store.save();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    /* Leerer Speicher, aber ein Offline-Cache einer früheren Version ist da: dann war die App schon einmal in Benutzung. */
    if (WF.storeWasEmpty && window.caches) caches.keys().then(function (ks) {
      if (ks.some(function (k) { return k.indexOf("wf-") === 0; }) && !S().tot.t) { lost = true; ui.refresh && ui.refresh(); }
    }).catch(function () {});
  });

  /* Jeder erzeugte Code zählt als Sicherung. */
  var orig = WF.store.exportCode;
  WF.store.exportCode = function () { S().backupAt = U.today(); WF.store.save(); return orig(); };

  function daysSince(d) { return d ? Math.round((new Date(U.today()) - new Date(d)) / 864e5) : 999; }
  H.bk = function () {
    var code = WF.store.exportCode();
    var done = function () { ui.toast({ title: "Code kopiert", sub: "Am besten in Notizen einfügen." }); ui.go("home"); };
    try { navigator.clipboard.writeText(code).then(done, function () { ui.go("profile"); }); } catch (e) { ui.go("profile"); }
  };
  H.bkload = function () { ui.go("profile"); setTimeout(function () { var t = document.getElementById("code"); if (t) { t.scrollIntoView({ block: "center" }); t.focus(); } }, 50); };

  WF.registerEntry({ where: "home", order: 3, render: function () {
    var st = S();
    if (!st.tot.t && !st.course) return '<div class="card note"><b>' + (lost ? "Fortschritt nicht gefunden" : "Schon mal gespielt?") + '</b><p class="small mute">' +
      (lost ? "Auf diesem Gerät ist kein Spielstand gespeichert. Hast du einen Sicherungscode, kannst du ihn laden." : "Mit einem Sicherungscode holst du deinen alten Spielstand zurück.") + "</p>" + btn("bkload", "Sicherungscode laden") + "</div>";
    if (st.tot.t >= 30 && daysSince(st.backupAt) >= 7) return '<div class="card note"><b>Fortschritt sichern</b><p class="small mute">' + st.tot.t +
      " Antworten liegen nur auf diesem Gerät. Wird die App vom Home-Bildschirm gelöscht, ist alles weg. Ein Code in deinen Notizen schützt davor.</p>" + btn("bk", "Code kopieren", { primary: true }) + "</div>";
    return "";
  } });
})();
