/* Rückmeldung bei Antworten: Vibration und kurzer Ton. Standard: aus.
   Hinweis: Safari auf dem iPhone unterstützt keine Vibration aus Webseiten; dort ist nur der Ton hörbar. */
(function () {
  "use strict";
  var WF = window.WF, ac = null;
  function S() { return WF.store.data; }

  function tone(ok) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      var now = ac.currentTime, notes = ok ? [660, 880] : [300, 220];
      notes.forEach(function (f, i) {
        var o = ac.createOscillator(), g = ac.createGain(), t = now + i * 0.09;
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.13);
      });
    } catch (e) {}
  }
  WF.on("answered", function (r) {
    var m = S().settings.fx;
    if (m === "off") return;
    if (navigator.vibrate) try { navigator.vibrate(r.ok ? 25 : [50, 40, 50]); } catch (e) {}
    if (m === "all") tone(r.ok);
  });
  WF.registerEntry({ where: "settings", order: 10, render: function () {
    return WF.ui.prefSeg("Rückmeldung", "fx", [["off", "Aus"], ["vib", "Vibration"], ["all", "+ Ton"]]) +
      '<p class="small mute" style="margin:-6px 0 0">Vibration funktioniert nicht auf dem iPhone, der Ton schon.</p>';
  } });
})();
