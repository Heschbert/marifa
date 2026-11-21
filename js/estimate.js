/* Schätzfragen: Zahl eintippen, Punkte nach Nähe (0 bis 3). Daten: data/schaetzen.json.
   Wird vom Modus „Schätzen“ und vom Duell genutzt (WF.est). */
(function () {
  "use strict";
  var WF = window.WF, D = WF.data, U = WF.util, esc = U.esc;

  /* Baustein für data.js: erzeugt keine Auswahlfragen, die Rohdaten liegen in D.raw.estimate */
  WF.builders.estimate = function () { return []; };

  function list(c) { return ((D.raw && D.raw.estimate) || []).filter(function (x) { return !c || x.c === c; }); }
  function fmt(n) {
    var neg = n < 0, s = String(Math.abs(Math.round(n * 1000) / 1000)).split(".");
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (neg ? "−" : "") + s.join(",");
  }
  /* Akzeptiert 8849, 8.849, 8 849, 42,195, -273,15, 1,5 Mio. */
  function parse(t) {
    t = String(t || "").trim().toLowerCase().replace(/\s+/g, "").replace(/−/g, "-");
    var mult = 1;
    if (/(mio|millionen)\.?$/.test(t)) { mult = 1e6; t = t.replace(/(mio|millionen)\.?$/, ""); }
    else if (/(mrd|milliarden)\.?$/.test(t)) { mult = 1e9; t = t.replace(/(mrd|milliarden)\.?$/, ""); }
    else if (/(tsd|tausend)\.?$/.test(t)) { mult = 1e3; t = t.replace(/(tsd|tausend)\.?$/, ""); }
    if (t.indexOf(",") >= 0) t = t.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
    return parseFloat(t) * mult;
  }
  /* Punkte: Jahreszahlen nach Jahren Abstand, sonst nach prozentualer Abweichung. */
  function score(x, g) {
    if (g === null || isNaN(g)) return { p: 0, off: null, txt: "" };
    if (x.kind === "year") {
      var d = Math.abs(g - x.a);
      return { p: d <= 1 ? 3 : d <= 5 ? 2 : d <= 20 ? 1 : 0, off: d, txt: d === 0 ? "genau richtig" : d + (d === 1 ? " Jahr" : " Jahre") + " daneben" };
    }
    var r = Math.abs(g - x.a) / Math.abs(x.a), pc = Math.round(r * 1000) / 10;
    return { p: r <= 0.02 ? 3 : r <= 0.10 ? 2 : r <= 0.25 ? 1 : 0, off: r, txt: r === 0 ? "genau richtig" : String(pc).replace(".", ",") + " % daneben" };
  }
  function answerText(x) { return fmt(x.a) + (x.u ? " " + x.u : ""); }
  function input(id) {
    return '<label class="small mute" for="' + id + '">Deine Schätzung</label><div class="estin"><input id="' + id + '" class="inp" inputmode="decimal" autocomplete="off" placeholder="Zahl eingeben">' +
      "</div>";
  }
  function inputFor(x, id) { return input(id).replace("</div>", (x.u ? '<span class="unit">' + esc(x.u) + "</span>" : "") + "</div>"); }

  WF.est = { list: list, parse: parse, score: score, fmt: fmt, answerText: answerText, inputFor: inputFor,
    pointsInfo: "3 Punkte: höchstens 2 % daneben (bei Jahren 1 Jahr) · 2 Punkte: 10 % (5 Jahre) · 1 Punkt: 25 % (20 Jahre)" };
})();

/* Modus „Schätzen“: 5 Fragen, Zahl eintippen, Punkte nach Nähe. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn, X = WF.est;
  function S() { return WF.store.data; }
  var N = 5, G = null;

  H.est = function () {
    var c = S().settings.playC || null, l = X.list(c);
    if (l.length < N) l = X.list(null);
    G = { qs: U.shuffle(l.slice()).slice(0, N), i: 0, pts: 0, res: [], xp: 0 };
    q();
  };
  function q() {
    var x = G.qs[G.i];
    var h = '<div class="topbar"><button class="ghost" data-act="estquit">✕ Beenden</button><span class="chip">' + (G.i + 1) + " / " + N + "</span></div>" + ui.bar(G.i / N * 100, "Fortschritt");
    h += '<div class="qmeta">Schätzen · ' + esc(x.c) + '</div><p class="q">' + esc(x.q) + "</p>";
    h += '<form id="estf">' + X.inputFor(x, "estv") + '<p class="small mute" id="esterr" aria-live="polite"></p><button type="submit" class="btn primary">Schätzung abgeben</button></form>';
    ui.show(h, null, false);
    var inp = document.getElementById("estv"); if (inp) try { inp.focus(); } catch (e) {}
    document.getElementById("estf").addEventListener("submit", function (e) { e.preventDefault(); H.estgo(); });
  }
  H.estgo = function () {
    var x = G.qs[G.i], v = X.parse(document.getElementById("estv").value);
    if (v === null) { document.getElementById("esterr").textContent = "Bitte eine Zahl eingeben, z. B. 8849 oder 42,195."; return; }
    var r = X.score(x, v), gain = r.p * 4;
    G.pts += r.p; G.res.push(r.p); G.xp += gain;
    E.registerPlay(); if (gain) E.addXP(gain); WF.store.save();
    WF.emit("answered", { ok: r.p >= 2, gain: gain, x: { retry: false }, estimate: true });
    var cls = r.p >= 2 ? "ok" : "bad";
    var h = '<div class="topbar"><button class="ghost" data-act="estquit">✕ Beenden</button><span class="chip">' + (G.i + 1) + " / " + N + "</span></div>" + ui.bar((G.i + 1) / N * 100, "Fortschritt");
    h += '<div class="qmeta">Schätzen · ' + esc(x.c) + '</div><p class="q">' + esc(x.q) + "</p>";
    h += '<div id="fb" aria-live="polite"><div class="fb ' + cls + '"><b class="h">' + ["Leider weit daneben", "Grob in der Nähe", "Gut geschätzt", "Sehr nah dran"][r.p] + " · " + r.p + (r.p === 1 ? " Punkt" : " Punkte") + "</b>" +
      "<p>Richtig: <b>" + esc(X.answerText(x)) + "</b><br>Deine Schätzung: " + esc(X.fmt(v)) + (x.u ? " " + esc(x.u) : "") + " · " + esc(r.txt) + "</p>" + (x.e ? "<p>" + esc(x.e) + "</p>" : "") + "</div></div>";
    h += btn("estnext", G.i + 1 >= N ? "Ergebnis ansehen" : "Weiter", { primary: true });
    ui.show(h, null, false);
    var nb = document.querySelector('[data-act="estnext"]'); if (nb) try { nb.focus({ preventScroll: true }); } catch (e) {}
  };
  H.estnext = function () { G.i++; if (G.i >= N) return end(); q(); };
  H.estquit = function () { if (G.res.length) end(); else ui.go("home"); };
  function end() {
    var st = S(), max = G.res.length * 3, rec = false;
    st.best.est = st.best.est || 0;
    if (G.res.length === N && G.pts > st.best.est) { st.best.est = G.pts; rec = true; }
    WF.store.save();
    ui.show("<h1>Schätzen</h1>" + '<div class="score">' + G.pts + " von " + max + "</div>" +
      '<p class="mute">Punkte · +' + G.xp + " XP" + (rec ? " · neuer Rekord" : "") + "</p>" +
      '<p class="small mute">' + esc(X.pointsInfo) + "</p>" +
      '<div style="margin:16px 0">' + btn("est", "Nochmal", { primary: true }) + '<div style="height:8px"></div>' + btn("home", "Zur Startseite") + "</div>", null, false);
  }
  WF.registerEntry({ where: "home", order: 36, render: function (c) {
    return ui.row("est", "≈", "Schätzen", "5 Zahlenfragen · Punkte nach Nähe" + (c.st.best.est ? " · Rekord " + c.st.best.est : ""), {});
  } });
})();
