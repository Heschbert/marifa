/* Start: Daten laden, dann die Oberfläche öffnen. */
(function () {
  "use strict";
  var WF = window.WF;
  function boot() {
    WF.ui.applyPrefs(); WF.ui.loading();
    WF.data.load().then(function () { WF.ui.go("home"); }).catch(function (e) { console.error(e); WF.ui.failed(String(e && e.message || e)); });
  }
  WF.boot = boot;
  boot();
})();
