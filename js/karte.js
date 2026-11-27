/* Kartenquiz: Länder, Hauptstädte, Flüsse oder Gebirge auf der Karte antippen, wählbar nach Kontinent.
   Daten: data/karte.json (Natural Earth, erzeugt mit tools/karte-bau.mjs). 10 Fragen je Runde.
   Länder, Flüsse, Gebirge: richtiges Objekt antippen. Hauptstädte: Ort antippen, richtig bei geringer Entfernung. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var MAP = null, N = 10, G = null;
  var KINDS = [["land", "Länder"], ["cap", "Hauptstädte"], ["river", "Flüsse"], ["mt", "Gebirge"]];
  function cfg() { var s = S().settings; return s.map || (s.map = { k: "land", r: "Welt" }); }
  function load() {
    if (MAP) return Promise.resolve(MAP);
    return fetch("data/karte.json").then(function (r) { if (!r.ok) throw new Error("karte.json " + r.status); return r.json(); }).then(function (j) { MAP = j; return j; });
  }
  function regionNames() { var geo = D.raw.geo || D.raw.flags || {}; return Object.keys(geo).filter(function (r) { return r !== "Deutschland" && geo[r].caps; }); }
  function countriesOf(region) {
    var geo = D.raw.geo || D.raw.flags || {}, iso = WF.countryISO || {}, out = [];
    regionNames().forEach(function (r) {
      if (region !== "Welt" && r !== region) return;
      geo[r].caps.split(";").forEach(function (x) { var n = x.split("|")[0]; if (iso[n] && MAP.c[iso[n]]) out.push({ n: n, c: iso[n], r: r }); });
    });
    return out;
  }
  function nameOfCode() { var m = {}; Object.keys(WF.countryISO).forEach(function (n) { m[WF.countryISO[n]] = n; }); return m; }

  /* ---------- Ausschnitt ---------- */
  /* Fenster um ein Objekt (Rahmen b); das Objekt liegt zufällig im mittleren Bereich, damit der Ausschnitt nichts verrät */
  function view(b, region, minW) {
    var cw = b[2] - b[0], ch = b[3] - b[1];
    var ww = Math.max(minW || (region === "Europa" ? 170 : 250), cw * 1.5, ch * 1.5 * 1.35), wh = ww / 1.35;
    var x = b[0] - (ww - cw) * (0.25 + Math.random() * 0.5), y = b[1] - (wh - ch) * (0.25 + Math.random() * 0.5);
    x = Math.max(0, Math.min(MAP.w - ww, x)); y = Math.max(0, Math.min(MAP.h - wh, y));
    return [x, y, ww, wh];
  }
  function hits(b, vb) { return b[2] > vb[0] && b[0] < vb[0] + vb[2] && b[3] > vb[1] && b[1] < vb[1] + vb[3]; }
  function tappable(b, vb) { return (b[2] - b[0]) * (b[3] - b[1]) >= vb[2] * vb[3] * 0.0012; }

  /* ---------- Runde zusammenstellen ---------- */
  function shuffle(a) { return U.shuffle(a.slice()); }
  function newGame() {
    var c = cfg(), items = [];
    if (c.k === "land") {
      shuffle(countriesOf(c.r)).forEach(function (x) {
        if (items.length >= N) return;
        var vb = view(MAP.c[x.c].b, x.r); if (tappable(MAP.c[x.c].b, vb)) items.push({ k: "land", n: x.n, id: x.c, r: x.r, vb: vb });
      });
    } else if (c.k === "cap") {
      shuffle(MAP.caps.filter(function (x) { return c.r === "Welt" || x.r === c.r; })).slice(0, N).forEach(function (x) {
        items.push({ k: "cap", n: x.n, land: x.l, r: x.r, x: x.x, y: x.y, vb: view([x.x, x.y, x.x, x.y], x.r, x.r === "Europa" ? 150 : 230) });
      });
    } else {
      var list = c.k === "river" ? MAP.rv : MAP.mt;
      shuffle(list.filter(function (x) { return c.r === "Welt" || x.r.indexOf(c.r) >= 0; })).slice(0, N).forEach(function (x) {
        items.push({ k: c.k, n: x.n, id: x.n, r: c.r === "Welt" ? x.r[0] : c.r, vb: view(x.b, null, 140) });
      });
    }
    G = { i: 0, score: 0, xp: 0, log: [], qs: items, k: c.k };
  }

  /* ---------- Zeichnen ---------- */
  function svg(q, mark) {
    var vb = q.vb, land = q.k === "land" && !mark;
    var h = '<svg class="kmap" id="kmap" viewBox="' + vb.map(function (v) { return v.toFixed(1); }).join(" ") + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Kartenausschnitt">';
    Object.keys(MAP.c).forEach(function (c) {
      if (!hits(MAP.c[c].b, vb)) return;
      var cls = "kc" + (mark && mark[c] ? " " + mark[c] : "");
      h += '<path class="' + cls + '" d="' + MAP.c[c].d + '"' + (land ? ' data-act="ktap" data-c="' + c + '"' : "") + "/>";
    });
    if (q.k === "mt") MAP.mt.forEach(function (m) {
      if (!hits(m.b, vb)) return;
      h += '<path class="kmt' + (mark && mark[m.n] ? " " + mark[m.n] : "") + '" d="' + m.d + '"' + (!mark ? ' data-act="ktap" data-c="' + esc(m.n) + '"' : "") + "/>";
    });
    if (q.k === "river") MAP.rv.forEach(function (r) {
      if (!hits(r.b, vb)) return;
      h += '<path class="krv' + (mark && mark[r.n] ? " " + mark[r.n] : "") + '" d="' + r.d + '"/>';
      if (!mark) h += '<path class="krvhit" d="' + r.d + '" data-act="ktap" data-c="' + esc(r.n) + '"/>';
    });
    if (mark) h += labels(q, mark);
    return h + "</svg>";
  }
  function labels(q, mark) {
    var vb = q.vb, fs = vb[2] / 22, h = "", nm = nameOfCode();
    function put(x, y, text, cls) {
      x = Math.max(vb[0] + fs * 3, Math.min(vb[0] + vb[2] - fs * 3, x)); y = Math.max(vb[1] + fs, Math.min(vb[1] + vb[3] - fs * 0.6, y));
      h += '<text class="klabel ' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + fs.toFixed(1) + '" text-anchor="middle" dominant-baseline="middle">' + esc(text) + "</text>";
    }
    if (q.k === "cap") return "";
    Object.keys(mark).forEach(function (id) {
      var b = q.k === "land" ? MAP.c[id].b : (q.k === "river" ? MAP.rv : MAP.mt).filter(function (x) { return x.n === id; })[0].b;
      if (b[2] - b[0] > MAP.w / 2) return;
      put((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, q.k === "land" ? nm[id] || "" : id, mark[id]);
    });
    return h;
  }
  function head() {
    return '<div class="topbar"><button class="ghost" data-act="kquit">✕ Beenden</button><span class="chip">' + esc(kindName(G.k)) + '</span><span class="chip">' + Math.min(G.i + 1, G.qs.length) + " / " + G.qs.length + "</span></div>" + ui.bar(G.i / G.qs.length * 100, "Fortschritt");
  }
  function kindName(k) { return KINDS.filter(function (x) { return x[0] === k; })[0][1]; }
  function prompt(q) {
    if (q.k === "land") return "Wo liegt <b>" + esc(q.n) + "</b>?";
    if (q.k === "cap") return "Wo liegt <b>" + esc(q.n) + "</b>? <span class=\"mute\">(" + esc(q.land) + ")</span>";
    if (q.k === "river") return "Tippe auf den Fluss <b>" + esc(q.n) + "</b>";
    return "Tippe auf das Gebirge <b>" + esc(q.n) + "</b>";
  }
  function hint(q) { return q.k === "cap" ? "tippe dorthin, wo die Stadt liegt" : q.k === "land" ? "tippe auf das Land" : q.k === "river" ? "tippe auf die blaue Linie" : "tippe auf die braune Fläche"; }
  function ask() {
    var q = G.qs[G.i];
    ui.show(head() + '<p class="kq">' + prompt(q) + '</p><div class="kwrap">' + svg(q) + '</div><p class="small mute kreg">' + esc(q.r || "") + " · " + hint(q) + "</p>", null);
    if (q.k === "cap") {
      var el = document.getElementById("kmap");
      el.addEventListener("click", function (e) {
        var pt = el.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        var p = pt.matrixTransform(el.getScreenCTM().inverse()); answerCap(q, p.x, p.y);
      }, { once: true });
    }
  }
  function finish(q, ok, mapHtml, msg) {
    if (ok) { G.score++; G.xp += 15; E.addXP(15); }
    G.log.push(ok);
    ui.show(head() + '<p class="kq">' + prompt(q) + '</p><div class="kwrap">' + mapHtml + "</div>" + msg +
      '<div class="nextbar">' + btn("knext", G.i + 1 < G.qs.length ? "Weiter" : "Ergebnis", { primary: true }) + "</div>", null);
  }
  H.ktap = function (d) {
    var q = G.qs[G.i]; if (!q || q.done) return; q.done = true;
    var ok = d.c === q.id, mark = {}; mark[q.id] = "ok"; if (!ok) mark[d.c] = "bad";
    var tapped = q.k === "land" ? nameOfCode()[d.c] || "ein anderes Land" : d.c;
    var what = q.k === "land" ? "Das Land" : q.k === "river" ? "Der Fluss" : "Das Gebirge";
    finish(q, ok, svg(q, mark), ok ? '<div class="fb ok"><b class="h">Richtig · +15 XP</b><p>' + esc(q.n) + " ist grün markiert.</p></div>"
      : '<div class="fb bad"><b class="h">Nicht ganz</b><p>Du hast <b>' + esc(tapped) + "</b> getippt. " + what + " " + esc(q.n) + " ist grün markiert.</p></div>");
  };
  /* Hauptstädte: richtig, wenn der Tipp nah genug liegt (6 % der Ausschnittbreite) */
  function answerCap(q, x, y) {
    if (q.done) return; q.done = true;
    var dist = Math.hypot(x - q.x, y - q.y), ok = dist <= q.vb[2] * 0.06, vb = q.vb, r = vb[2] / 70, fs = vb[2] / 22;
    var m = svg(q, {}).replace("</svg>", "") +
      '<line class="kline" x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + q.x + '" y2="' + q.y + '"/>' +
      '<circle class="kdot bad" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(2) + '"/>' +
      '<circle class="kdot ok" cx="' + q.x + '" cy="' + q.y + '" r="' + (r * 1.3).toFixed(2) + '"/>' +
      '<text class="klabel ok" x="' + q.x + '" y="' + (q.y - fs * 1.1).toFixed(1) + '" font-size="' + fs.toFixed(1) + '" text-anchor="middle">' + esc(q.n) + "</text></svg>";
    finish(q, ok, m, ok ? '<div class="fb ok"><b class="h">Treffer · +15 XP</b><p>' + esc(q.n) + " ist grün markiert.</p></div>"
      : '<div class="fb bad"><b class="h">Daneben</b><p>Dein Tipp ist rot, ' + esc(q.n) + " liegt beim grünen Punkt.</p></div>");
  }
  H.knext = function () { G.i++; if (G.i < G.qs.length) ask(); else end(); };
  function end() {
    var st = S(), key = "map_" + G.k, best = st.best[key] || 0, rec = G.score > best;
    if (rec) st.best[key] = G.score;
    st.best.map = Math.max(st.best.map || 0, G.score);
    WF.store.save();
    if (rec && best > 0) WF.emit("celebrate", { icon: "🗺", kind: "record", title: "Neuer Rekord: " + kindName(G.k), sub: G.score + " von " + G.qs.length });
    ui.show("<h1>" + G.score + " von " + G.qs.length + '</h1><p class="mute">' + esc(kindName(G.k)) + " · " + esc(cfg().r) + " · +" + G.xp + " XP · Rekord " + Math.max(best, G.score) + "</p>" +
      '<div class="card"><div class="kdots">' + G.log.map(function (o, i) { return '<span class="' + (o ? "ok" : "bad") + '">' + esc(G.qs[i].n) + "</span>"; }).join("") + "</div></div>" +
      btn("kgo", "Nochmal", { primary: true }) + '<div style="height:8px"></div>' + btn("kstart", "Andere Auswahl") + '<div style="height:8px"></div>' + btn("home", "Zur Startseite"), null);
  }
  H.kquit = function () { ui.go("home"); };

  /* ---------- Auswahl vor dem Spiel ---------- */
  function setup() {
    var c = cfg(), regs = ["Welt"].concat(regionNames());
    var h = '<button class="ghost" data-act="home">‹ Zurück</button><h1>Karte</h1><p class="mute">Finde Orte auf der Karte. 10 Fragen, +15 XP je Treffer.</p>';
    h += '<h2>Was willst du finden?</h2><div class="kpick">' + KINDS.map(function (k) {
      return '<button class="chipsel' + (c.k === k[0] ? " on" : "") + '" aria-pressed="' + (c.k === k[0]) + '" data-act="kset" data-f="k" data-v="' + k[0] + '">' + k[1] + "</button>";
    }).join("") + "</div>";
    h += '<h2>Wo?</h2><div class="kpick">' + regs.map(function (r) {
      return '<button class="chipsel' + (c.r === r ? " on" : "") + '" aria-pressed="' + (c.r === r) + '" data-act="kset" data-f="r" data-v="' + esc(r) + '">' + esc(r) + "</button>";
    }).join("") + "</div>";
    h += '<div style="margin-top:20px">' + btn("kgo", "Start", { primary: true }) + "</div>";
    ui.show(h, null);
  }
  H.kset = function (d) { cfg()[d.f] = d.v; WF.store.save(); setup(); };
  H.kstart = function () {
    ui.loading();
    load().then(setup).catch(function (e) { console.error(e); ui.toast({ title: "Karte konnte nicht geladen werden" }); ui.go("home"); });
  };
  H.kgo = function () {
    load().then(function () {
      newGame();
      if (G.qs.length < 3) { ui.toast({ title: "Zu wenig für diese Auswahl", sub: "Wähle einen anderen Kontinent oder „Welt“." }); setup(); return; }
      ask();
    }).catch(function (e) { console.error(e); ui.toast({ title: "Karte konnte nicht geladen werden" }); ui.go("home"); });
  };
  WF.registerEntry({ where: "home", order: 37, render: function (c) { return ui.row("kstart", "🗺", "Karte", "Länder, Hauptstädte, Flüsse, Gebirge · nach Kontinent", {}); } });
})();
