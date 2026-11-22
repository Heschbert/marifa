/* Freie Eingabe: Bei Fragen, die schon sitzen, tippt man die Antwort selbst ein (stärkerer Lerneffekt als Wiedererkennen).
   Nur bei kurzen Antworten und Fragen, die ohne Auswahl sinnvoll sind. Kleine Tippfehler, Groß/Klein, Akzente und Artikel
   werden toleriert. Grenze: Anders formulierte, aber richtige Antworten erkennt der Vergleich nicht. Deshalb kann man
   jederzeit auf „Auswahl zeigen“ wechseln. Einstellung: Aus / Bei gemeisterten Fragen (Standard) / Immer, wenn möglich. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H;
  function S() { return WF.store.data; }
  var MAXLEN = 30;
  var NEEDS_CHOICE = /dieser|folgend|schreibung|aussage|trifft|stimmt|richtig|falsch|reihenfolge|was gilt|welche.*(ist|sind).*(nicht|kein)/i;

  function norm(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss")
      .replace(/[„“"'’.,;:!?()\-–]/g, " ").replace(/\s+/g, " ").trim()
      .replace(/^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|in|im|in der|in den|am|an der|auf dem|zum|zur|mit|fur|durch|als)\s+/, "")
      .replace(/^(der|die|das|den|dem|des|ein|eine|einen)\s+/, "");
  }
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  /* Akzeptierte Formen: ganze Antwort; ohne Klammerzusatz; der Klammerinhalt allein. */
  function variants(ans) {
    var v = [ans], m = /^(.*?)\s*\((.+)\)\s*$/.exec(ans);
    if (m) { v.push(m[1]); v.push(m[2]); }
    return v.map(norm).filter(Boolean);
  }
  function matches(typed, ans) {
    var t = norm(typed);
    if (!t) return false;
    if (/^\d/.test(t)) return variants(ans).some(function (v) { return v.replace(/\s/g, "") === t.replace(/\s/g, ""); });
    return variants(ans).some(function (v) { var tol = v.length <= 5 ? 0 : v.length <= 11 ? 1 : 2; return lev(t, v) <= tol; });
  }

  function eligible(x, s) {
    var mode = S().settings.typein, m = s.m;
    if (mode === "off" || m.timer || m.auto || m.daily || x.gen || x.forceMC || x.big || x.img) return false;
    var right = x.opts.filter(function (o) { return o.ok; })[0];
    if (!right || right.t.length > MAXLEN || NEEDS_CHOICE.test(x.q)) return false;
    if (mode === "always") return true;
    var r = S().qs[x.id];
    return !!(r && r.b >= 3);
  }

  WF.answerArea = function (x, s) {
    if (!eligible(x, s)) return null;
    return '<form id="typef" class="typebox"><label class="small mute" for="typev">Das sitzt schon – tipp die Antwort selbst ein</label>' +
      '<input id="typev" class="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Deine Antwort">' +
      '<button type="submit" class="btn primary">Prüfen</button><button type="button" class="link small" data-act="typemc" style="margin-top:10px">Auswahl zeigen</button></form>';
  };
  /* Absenden: Formular-Ereignis (Enter oder Knopf) */
  document.addEventListener("submit", function (e) {
    if (e.target.id !== "typef") return;
    e.preventDefault();
    var x = E.cur(), inp = document.getElementById("typev"), val = inp.value.trim();
    if (!val || E.s.answered) return;
    var right = x.opts.filter(function (o) { return o.ok; })[0], ok = matches(val, right.t);
    var r = E.answer(-1, null, { t: val, ok: ok });
    if (!r) return;
    inp.disabled = true;
    [].forEach.call(document.querySelectorAll("#typef button"), function (b) { b.remove(); });
    ui.paint(r);
    if (ok && norm(val) !== norm(right.t)) { var hh = document.querySelector("#fb .fb b.h"); if (hh) hh.insertAdjacentHTML("afterend", '<p class="small">Genaue Schreibweise: <b>' + esc(right.t) + "</b></p>"); }
    if (!ok) { var h2 = document.querySelector("#fb .fb b.h"); if (h2) h2.insertAdjacentHTML("afterend", '<p class="small mute">Anders formuliert, aber gemeint? Das erkennt der Vergleich nicht immer. Die Frage kommt einfach wieder.</p>'); }
  }, true);
  H.typemc = function () { var x = E.cur(); x.forceMC = true; ui.refreshQuiz(); };

  WF.registerEntry({ where: "settings", order: 7, render: function () {
    return ui.prefSeg("Antworten eintippen", "typein", [["off", "Aus"], ["mastered", "Wenn es sitzt"], ["always", "Immer"]]) +
      '<p class="small mute" style="margin:-6px 0 12px">Bei kurzen Antworten tippst du selbst statt auszuwählen. Kleine Tippfehler sind erlaubt.</p>';
  } });
})();
