/* Version sichtbar machen: unten im Profil, und beim ersten Start nach einem Update eine Meldung. */
(function () {
  "use strict";
  var WF = window.WF, U = WF.util, esc = U.esc;
  function S() { return WF.store.data; }
  function date(d) { var p = String(d).split("-"); return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : d; }

  WF.on("ready", function () {
    var st = S(), seen = st.settings.seenVersion;
    if (seen !== WF.VERSION) {
      if (seen) WF.emit("toast", { title: "Neue Version " + WF.VERSION + " geladen", sub: "Stand " + date(WF.BUILD) });
      st.settings.seenVersion = WF.VERSION;
      WF.store.save();
    }
  });

  WF.registerEntry({ where: "profileend", order: 99, render: function () {
    return '<p class="small mute center" style="margin:24px 0 0">Marifa · Version ' + esc(WF.VERSION) + " · Stand " + esc(date(WF.BUILD)) + "</p>";
  } });
})();
