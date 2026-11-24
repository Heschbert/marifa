/* Lernpfade: feste Kurzprogramme über mehrere Tage, z. B. „Geld im Griff in 10 Tagen“.
   Jeden Tag ein Paket aus dem Fragenbestand, Kernwissen zuerst. Pro Kalendertag ein Paket, damit Wiederholung über Tage wirkt.
   Abschluss: +150 XP und eine Urkunde im Profil. Zustand: st.paths[id] = { d: erledigte Tage, last: Datum, done: Datum }. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var PATHS = [
    { id: "geld", t: "Geld im Griff", ico: "€", days: 10, sub: "Sparen, Kredite, Versicherungen, Steuern", from: [["Wirtschaft & Geld", "Sparen & Anlegen"], ["Wirtschaft & Geld", "Steuern, Verträge & Versicherungen"]] },
    { id: "hilfe", t: "Erste Hilfe sicher", ico: "✚", days: 7, sub: "Notruf, Wiederbelebung, Verletzungen", from: [["Gesundheit", "Erste Hilfe"]] },
    { id: "recht", t: "Recht im Alltag", ico: "§", days: 7, sub: "Miete, Arbeit, Kaufen, Behörden", from: [["Politik & Recht", "Recht im Alltag"]] },
    { id: "denken", t: "Denkfehler durchschauen", ico: "◎", days: 10, sub: "Verzerrungen, Fehlschlüsse, gute Entscheidungen", from: [["Denken & Psychologie", "Denkfehler"], ["Denken & Psychologie", "Entscheiden & Argumentieren"]] },
    { id: "netz", t: "Sicher im Netz", ico: "🔒", days: 5, sub: "Passwörter, Betrug, Datenschutz, KI", from: [["Naturwissenschaft & Technik", "Technik & IT"]],
      only: /Passwort|Phishing|verschlüssel|Verschlüssel|Backup|Ransomware|Daten|KI\b|Sprachmodell|Halluzination|Betrug|Social Engineering|Update|Zwei-Faktor|VPN|https|Deepfake|SMS|Bank|Hash|Brute|Zero-Day|Cloud|Schadsoftware|Anrufer/ },
    { id: "gesund", t: "Gesund leben", ico: "♥", days: 7, sub: "Ernährung, Bewegung, Schlaf, Vorsorge", from: [["Gesundheit", "Ernährung & Lebensstil"], ["Gesundheit", "Körper & Medizin"]] }
  ];
  var BONUS = 150;
  function state(p) { var all = S().paths || (S().paths = {}); return all[p.id] || (all[p.id] = { d: 0, last: "", done: "" }); }
  /* Fragenliste eines Pfads: Kernwissen zuerst, dann nützlich; Wissenswertes nur, wenn nötig. Feste Reihenfolge. */
  function pool(p) {
    var l = [];
    p.from.forEach(function (f) { l = l.concat(D.realList(f[0], f[1]).filter(function (x) { return x.a && !x.gen && (!p.only || p.only.test(x.q + " " + x.a[0])); })); });
    return l.sort(function (a, b) { return (a.p || 2) - (b.p || 2) || (a.id < b.id ? -1 : 1); });
  }
  function dayIds(p, n) {
    var l = pool(p), per = Math.min(10, Math.max(5, Math.ceil(Math.min(l.length, p.days * 10) / p.days)));
    var part = l.slice(n * per, n * per + per);
    if (part.length < 5) part = U.shuffle(l.slice(), U.mulberry(U.seedOf(p.id + n))).slice(0, per);
    return part.map(function (x) { return x.id; });
  }
  H.pathgo = function (d) {
    var p = PATHS.filter(function (q) { return q.id === d.p; })[0], s = state(p);
    if (s.done || s.last === U.today()) return;
    ui.startWith("pack", { c: null, s: null }, { ids: dayIds(p, s.d), title: p.t + " · Tag " + (s.d + 1), path: p.id });
  };
  WF.on("roundEnd", function (s) {
    if (!s || !s.opts || !s.opts.path) return;
    var p = PATHS.filter(function (q) { return q.id === s.opts.path; })[0], st = state(p);
    if (s.score + s.wrong.length < s.planned || st.last === U.today()) return;
    st.d++; st.last = U.today();
    if (st.d >= p.days) {
      st.done = U.today(); E.addXP(BONUS);
      WF.emit("celebrate", { icon: "🎓", kind: "course", title: "Lernpfad geschafft: " + p.t, sub: "+" + BONUS + " XP. Deine Urkunde liegt im Profil." });
    } else WF.emit("toast", { title: p.t + ": Tag " + st.d + " von " + p.days, sub: "Morgen geht es weiter." });
    WF.store.save();
  });
  WF.registerEntry({ where: "areas", order: 50, render: function () {
    var h = '<h2>Lernpfade</h2><p class="small mute" style="margin:-4px 0 10px">Jeden Tag ein kleines Paket, Kernwissen zuerst. Am Ende gibt es eine Urkunde.</p>';
    PATHS.forEach(function (p) {
      var s = state(p), today = s.last === U.today(), pct = s.d / p.days * 100;
      var sub = s.done ? "Abgeschlossen am " + s.done.split("-").reverse().join(".") : s.d === 0 ? p.days + " Tage · " + p.sub : "Tag " + s.d + " von " + p.days + (today ? " · nächster Teil morgen" : " · weiter mit Tag " + (s.d + 1));
      h += '<button class="item path' + (s.done || today ? " off" : "") + '" data-act="pathgo" data-p="' + p.id + '"' + (s.done || today ? " disabled" : "") + '>' +
        ui.ring(pct, "var(--accent)", s.done ? "✓" : p.ico) + '<div class="grow"><div class="t">' + esc(p.t) + '</div><div class="small mute">' + esc(sub) + '</div></div><span class="chev" aria-hidden="true">›</span></button>';
    });
    return h;
  } });
  WF.registerEntry({ where: "profile", order: 12, render: function () {
    var done = PATHS.filter(function (p) { return state(p).done; });
    if (!done.length) return "";
    return "<h2>Urkunden</h2>" + done.map(function (p) {
      return '<div class="card cert"><span class="certic" aria-hidden="true">🎓</span><div class="grow"><b>' + esc(p.t) + '</b><div class="small mute">Lernpfad mit ' + p.days + " Tagen abgeschlossen am " + state(p).done.split("-").reverse().join(".") + "</div></div></div>";
    }).join("");
  } });
  WF.paths = PATHS;
})();
