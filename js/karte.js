/* Kartenquiz: Länder auf der Weltkarte antippen. 10 Runden, je Frage wird der passende Kontinent vergrößert gezeigt.
   Karte: data/karte.json (Natural Earth über world-atlas, erzeugt mit tools/karte-bau.mjs). Länderliste und Kontinente
   kommen aus data/geo.json und den ISO-Codes in flags.js. Sehr kleine Länder werden nicht abgefragt (nicht antippbar). */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var MAP = null, N = 10, G = null;
  function load() {
    if (MAP) return Promise.resolve(MAP);
    return fetch("data/karte.json").then(function (r) { if (!r.ok) throw new Error("karte.json " + r.status); return r.json(); }).then(function (j) { MAP = j; return j; });
  }
  /* Kontinente mit ihren Ländern (nur solche, die auf der Karte vorkommen) */
  function regions() {
    var geo = D.raw.geo || D.raw.flags || {}, iso = WF.countryISO || {}, out = {};
    Object.keys(geo).forEach(function (r) {
      if (r === "Deutschland" || !geo[r].caps) return;
      var l = geo[r].caps.split(";").map(function (x) { return x.split("|")[0]; }).filter(function (n) { return iso[n] && MAP.c[iso[n]]; });
      if (l.length) out[r] = l;
    });
    return out;
  }
  /* Ausschnitt: ein Fenster um das gesuchte Land, das Land liegt zufällig irgendwo im mittleren Bereich (nicht genau in der Mitte),
     damit der Ausschnitt die Lösung nicht verrät. Europa enger, sonst weiter. */
  function view(code, region) {
    var b = MAP.c[code].b, cw = b[2] - b[0], ch = b[3] - b[1];
    var ww = Math.max(region === "Europa" ? 170 : 250, cw * 2.6, ch * 2.6 * 1.35), wh = ww / 1.35;
    var cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    var x = cx - ww * (0.3 + Math.random() * 0.4), y = cy - wh * (0.3 + Math.random() * 0.4);
    x = Math.max(0, Math.min(MAP.w - ww, x)); y = Math.max(0, Math.min(MAP.h - wh, y));
    return [x, y, ww, wh];
  }
  function inView(code, vb) { var b = MAP.c[code].b; return b[2] > vb[0] && b[0] < vb[0] + vb[2] && b[3] > vb[1] && b[1] < vb[1] + vb[3]; }
  function tappable(code, vb) { var b = MAP.c[code].b; return (b[2] - b[0]) * (b[3] - b[1]) >= vb[2] * vb[3] * 0.0012; }
  function newGame() {
    var reg = regions(), iso = WF.countryISO, items = [], names = Object.keys(reg), tries = 0;
    G = { reg: reg, i: 0, score: 0, xp: 0, log: [], qs: [] };
    while (items.length < N && tries++ < 500) {
      var r = names[Math.floor(Math.random() * names.length)], l = reg[r].filter(function (n) { return items.every(function (x) { return x.n !== n; }); });
      if (!l.length) continue;
      var n = l[Math.floor(Math.random() * l.length)], vb = view(iso[n], r);
      if (!tappable(iso[n], vb)) continue;
      items.push({ n: n, c: iso[n], r: r, vb: vb });
    }
    G.qs = items;
  }
  function svg(q, mark) {
    var vb = q.vb, h = '<svg class="kmap" viewBox="' + vb.map(function (v) { return v.toFixed(1); }).join(" ") + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Kartenausschnitt ' + esc(q.r) + '">';
    Object.keys(MAP.c).forEach(function (c) {
      if (!inView(c, vb)) return;
      var cls = "kc in";
      if (mark && mark[c]) cls += " " + mark[c];
      h += '<path class="' + cls + '" d="' + MAP.c[c].d + '"' + (!mark ? ' data-act="ktap" data-c="' + c + '"' : "") + "/>";
    });
    /* Nach der Antwort: Namen der markierten Länder auf die Karte schreiben */
    if (mark) {
      var fs = vb[2] / 22, nameOf = {};
      Object.keys(WF.countryISO).forEach(function (n) { nameOf[WF.countryISO[n]] = n; });
      Object.keys(mark).forEach(function (c) {
        var b = MAP.c[c].b, x = (b[0] + b[2]) / 2, y = (b[1] + b[3]) / 2;
        if (b[2] - b[0] > MAP.w / 2) return; /* Länder über die Datumsgrenze (z. B. Fidschi): kein Etikett, Lage wäre falsch */
        x = Math.max(vb[0] + fs * 3, Math.min(vb[0] + vb[2] - fs * 3, x)); y = Math.max(vb[1] + fs, Math.min(vb[1] + vb[3] - fs * 0.5, y));
        h += '<text class="klabel ' + mark[c] + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + fs.toFixed(1) + '" text-anchor="middle" dominant-baseline="middle">' + esc(nameOf[c] || "") + "</text>";
      });
    }
    return h + "</svg>";
  }
  function head() {
    return '<div class="topbar"><button class="ghost" data-act="kquit">✕ Beenden</button><span class="chip">Karte</span><span class="chip">' + Math.min(G.i + 1, G.qs.length) + " / " + G.qs.length + "</span></div>" + ui.bar(G.i / G.qs.length * 100, "Fortschritt");
  }
  function ask() {
    var q = G.qs[G.i];
    ui.show(head() + '<p class="kq">Wo liegt <b>' + esc(q.n) + '</b>?</p><div class="kwrap">' + svg(q) + '</div><p class="small mute kreg">' + esc(q.r) + " · tippe auf das Land</p>", null);
  }
  H.ktap = function (d) {
    var q = G.qs[G.i]; if (!q || q.done) return;
    q.done = true;
    var ok = d.c === q.c, mark = {}, nameOf = {};
    Object.keys(WF.countryISO).forEach(function (n) { nameOf[WF.countryISO[n]] = n; });
    mark[q.c] = "ok"; if (!ok) mark[d.c] = "bad";
    if (ok) { G.score++; G.xp += 15; E.addXP(15); }
    G.log.push(ok);
    var msg = ok ? '<div class="fb ok"><b class="h">Richtig · +15 XP</b><p>' + esc(q.n) + " liegt hier.</p></div>"
      : '<div class="fb bad"><b class="h">Nicht ganz</b><p>Du hast <b>' + esc(nameOf[d.c] || "ein anderes Land") + "</b> getippt. " + esc(q.n) + " ist grün markiert.</p></div>";
    ui.show(head() + '<p class="kq">Wo liegt <b>' + esc(q.n) + '</b>?</p><div class="kwrap">' + svg(q, mark) + "</div>" + msg +
      '<div class="nextbar">' + btn("knext", G.i + 1 < G.qs.length ? "Weiter" : "Ergebnis", { primary: true }) + "</div>", null);
  };
  H.knext = function () { G.i++; if (G.i < G.qs.length) ask(); else end(); };
  function end() {
    var st = S(), best = (st.best.map || 0), rec = G.score > best;
    if (rec) st.best.map = G.score;
    WF.store.save();
    if (rec && best > 0) WF.emit("celebrate", { icon: "🗺", kind: "record", title: "Neuer Kartenrekord", sub: G.score + " von " + G.qs.length });
    ui.show('<h1>' + G.score + " von " + G.qs.length + '</h1><p class="mute">+' + G.xp + " XP · Rekord " + Math.max(best, G.score) + "</p>" +
      '<div class="card"><div class="kdots">' + G.log.map(function (o, i) { return '<span class="' + (o ? "ok" : "bad") + '">' + esc(G.qs[i].n) + "</span>"; }).join("") + "</div></div>" +
      btn("kstart", "Nochmal", { primary: true }) + '<div style="height:8px"></div>' + btn("home", "Zur Startseite"), null);
  }
  H.kquit = function () { ui.go("home"); };
  H.kstart = function () {
    ui.loading();
    load().then(function () { newGame(); if (!G.qs.length) { ui.toast({ title: "Karte konnte nicht geladen werden" }); ui.go("home"); return; } ask(); })
      .catch(function (e) { console.error(e); ui.toast({ title: "Karte konnte nicht geladen werden" }); ui.go("home"); });
  };
  WF.registerEntry({ where: "home", order: 37, render: function (c) { return ui.row("kstart", "🗺", "Karte", "Länder auf der Weltkarte antippen · Rekord " + (c.st.best.map || 0), {}); } });
})();
