/* „Wie sicher bist du?“: Nach dem Antippen einer Antwort schätzt man ein, wie sicher man ist, erst dann wird aufgelöst.
   Wirkung (in engine.js): Richtig, aber geraten zählt nicht als gewusst. Falsch, aber sicher kommt bevorzugt wieder.
   Im Profil zeigt eine Übersicht, wie gut die eigene Einschätzung zur Trefferquote passt.
   Einstellung: Aus / Beim Lernen (Standard) / Immer. Nie in Blitz (Zeitdruck) und Duell. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H;
  function S() { return WF.store.data; }
  var LEVELS = [["g", "Geraten"], ["z", "Ziemlich sicher"], ["s", "Sicher"]];
  var picked = null, basePick = H.pick;

  function wanted() {
    var m = E.s && E.s.m, set = S().settings.conf;
    if (!m || m.timer || m.auto || set === "off") return false;
    return set === "all" || (set === "learn" && !!m.learn);
  }

  H.pick = function (d) {
    if (!wanted()) return basePick(d);
    var x = E.cur(), i = +d.i;
    if (E.s.answered || x.hidden.indexOf(i) >= 0) return;
    picked = i;
    [].forEach.call(document.querySelectorAll("#opts .ans"), function (b, k) { b.classList.toggle("sel", k === i); b.setAttribute("aria-pressed", k === i); });
    var fb = document.getElementById("fb");
    fb.innerHTML = '<div class="confbox"><p class="small"><b>Wie sicher bist du?</b></p><div class="seg" role="group" aria-label="Wie sicher bist du?" style="grid-template-columns:repeat(3,1fr)">' +
      LEVELS.map(function (l) { return '<button data-act="conf" data-v="' + l[0] + '">' + l[1] + "</button>"; }).join("") + "</div></div>";
    var first = fb.querySelector("button"); if (first) try { first.focus({ preventScroll: true }); } catch (e) {}
    fb.scrollIntoView({ behavior: ui.reduced() ? "auto" : "smooth", block: "nearest" });
  };

  H.conf = function (d) {
    if (picked === null || !E.s || E.s.answered) return;
    var i = picked; picked = null;
    var r = E.answer(i, d.v);
    if (!r) return;
    ui.paint(r);
    var note = "";
    if (r.ok && d.v === "g") note = "Richtig geraten. Das zählt noch nicht als gewusst, die Frage kommt wieder.";
    if (!r.ok && d.v === "s") note = "Du warst dir sicher. Genau solche Fragen kommen jetzt bevorzugt wieder.";
    var h = document.querySelector("#fb .fb b.h");
    if (note && h) h.insertAdjacentHTML("afterend", '<p class="small"><b>' + esc(note) + "</b></p>");
  };
  /* Neue Frage: Auswahl zurücksetzen */
  var baseNext = H.next;
  H.next = function () { picked = null; baseNext(); };

  WF.on("answered", function (r) {
    if (!r.conf || r.x.retry || r.slow) return;
    var c = S().calib || (S().calib = {}), k = c[r.conf] || (c[r.conf] = { r: 0, t: 0 });
    k.t++; if (r.ok) k.r++;
  });

  WF.registerEntry({ where: "settings", order: 5, render: function () {
    return ui.prefSeg("Sicherheit", "conf", [["auto", "Automatisch"], ["learn", "Beim Lernen fragen"], ["all", "Immer fragen"]]) +
      '<p class="small mute" style="margin:-6px 0 12px">Automatisch: Wer bei einer richtigen Antwort lange zögert, bekommt die Frage früher wieder. Fragen heißt: vor dem Auflösen „geraten, ziemlich sicher, sicher?“.</p>' +
      ui.prefSeg("Nach richtiger Antwort", "autoNext", [["auto", "Automatisch weiter"], ["stay", "Erklärung zeigen"]]);
  } });

  WF.registerEntry({ where: "profile", order: 20, render: function () {
    var c = S().calib || {}, tot = 0;
    LEVELS.forEach(function (l) { tot += (c[l[0]] || {}).t || 0; });
    if (tot < 10) return "";
    var h = '<h2>Selbsteinschätzung</h2><div class="card">';
    LEVELS.forEach(function (l) {
      var k = c[l[0]] || { r: 0, t: 0 };
      h += '<div style="margin-bottom:10px"><div class="row sb small"><b>' + l[1] + '</b><span class="mute">' + (k.t ? U.pct(k.r, k.t) + " % richtig · " + k.t + "×" : "noch nie gewählt") + "</span></div>" + (k.t ? ui.bar(U.pct(k.r, k.t), l[1] + ": Trefferquote") : "") + "</div>";
    });
    /* Faustregeln, keine wissenschaftliche Auswertung: ab 10 Antworten je Stufe */
    var s = c.s || { r: 0, t: 0 }, g = c.g || { r: 0, t: 0 }, tips = [];
    if (s.t >= 10 && U.pct(s.r, s.t) < 80) tips.push("Wenn du „sicher“ sagst, liegst du in " + U.pct(s.r, s.t) + " % richtig. Etwas mehr Vorsicht lohnt sich.");
    if (g.t >= 10 && U.pct(g.r, g.t) >= 50) tips.push("Beim Raten liegst du in " + U.pct(g.r, g.t) + " % richtig. Du weißt mehr, als du denkst.");
    if (tips.length) h += '<p class="small" style="margin:4px 0 0">' + tips.map(esc).join("<br>") + "</p>";
    return h + "</div>";
  } });
})();
