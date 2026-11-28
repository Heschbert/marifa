/* Kern: gemeinsamer Namensraum, Hilfsfunktionen, Ereignisse, Registrierung von Spielmodi. */
(function () {
  "use strict";
  var WF = window.WF = { modes: {}, modeOrder: [], builders: {}, handlers: {} };
  var U = WF.util = {};

  U.esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  U.pad = function (n) { return n < 10 ? "0" + n : "" + n; };
  U.dkey = function (d) { return d.getFullYear() + "-" + U.pad(d.getMonth() + 1) + "-" + U.pad(d.getDate()); };
  U.today = function () { return U.dkey(new Date()); };
  U.yesterday = function () { var d = new Date(); d.setDate(d.getDate() - 1); return U.dkey(d); };
  U.pct = function (a, b) { return b ? Math.round(100 * a / b) : 0; };
  U.ri = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  U.mulberry = function (seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  U.seedOf = function (str) { var h = 2166136261; for (var i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; };
  U.shuffle = function (a, rng) {
    rng = rng || Math.random;
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  /* Fragetext als HTML, mit optionalem großen Bild (x.img, z. B. Flaggen-Emoji) darüber */
  /* Antworttexte der Form "flag:de" werden als flaches Flaggenbild angezeigt (img/flags, MIT-Lizenz flag-icons). */
  U.ot = function (t) { var m = /^flag:([a-z]{2})$/.exec(String(t)); return m ? '<img class="flagimg" src="img/flags/' + m[1] + '.svg" alt="Flagge" draggable="false">' : U.esc(t); };
  U.oq = function (t) { return /^flag:/.test(String(t)) ? U.ot(t) : "„" + U.esc(t) + "“"; };
  U.qh = function (x) { return (x.img ? '<span class="qimg" role="img" aria-label="' + U.esc(x.imgAlt || "Bild") + '">' + U.ot(x.img) + "</span>" : "") + U.esc(x.q); };
  U.hash = function (s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  /* Ereignisse: Module melden sich mit WF.on an und werden über WF.emit benachrichtigt. */
  WF.on = function (ev, fn) { (WF.handlers[ev] = WF.handlers[ev] || []).push(fn); };
  WF.emit = function (ev, p) { (WF.handlers[ev] || []).forEach(function (fn) { try { fn(p); } catch (e) { console.error(ev, e); } }); };

  /* Spielmodi sind eigenständige Bausteine. Neue Modi werden hier registriert. */
  /* App-Version: nur mit „node tools/version.mjs <neu>“ ändern, das setzt auch sw.js. */
  WF.VERSION = "3.15";
  WF.BUILD = "2026-11-28";

  WF.registerMode = function (m) { WF.modes[m.id] = m; WF.modeOrder.push(m.id); };

  /* Einträge in der Oberfläche: Ein Feature trägt sich selbst an einer Stelle ein, ohne ui.js zu ändern.
     where: "home" (Spielen), "areas" (Lernen), "scope" (Themenseite), "result" (Ergebnis),
            "profiletop" (oben im Profil), "profile" (Abschnitte im Profil), "settings" (Einstellungen im Profil).
     render(ctx) liefert HTML oder "" (dann erscheint nichts). order sortiert aufsteigend.
     Startseite: order < 10 = Karten oben, 10–39 = Spielmodi allein, ab 40 = mit Freunden (Kacheln). */
  WF.entries = {};
  WF.registerEntry = function (e) { (WF.entries[e.where] = WF.entries[e.where] || []).push(e); WF.entries[e.where].sort(function (a, b) { return (a.order || 50) - (b.order || 50); }); };
  WF.slot = function (where, ctx, from, to) {
    function ord(e) { return e.order != null ? e.order : 50; }
    return (WF.entries[where] || []).filter(function (e) { var o = ord(e); return (from === undefined || o >= from) && (to === undefined || o < to); })
      .map(function (e, i) { return { e: e, i: i }; }).sort(function (a, b) { return ord(a.e) - ord(b.e) || a.i - b.i; }).map(function (x) { return x.e; }).map(function (e) { try { return e.render(ctx || {}) || ""; } catch (err) { console.error(where, err); return ""; } }).join("");
  };
})();
